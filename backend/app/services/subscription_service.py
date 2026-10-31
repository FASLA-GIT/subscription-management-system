from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.subscription import Subscription, SubscriptionItem
from app.models.plan import Plan
from app.models.product import Product, ProductVariant
from app.models.customer import Customer
from app.services.billing_calculator import (
    compute_next_billing_date,
    calculate_line_item,
    calculate_subscription_totals,
    VALID_FREQUENCIES
)


# Permitted lifecycle state transitions
VALID_TRANSITIONS = {
    "draft": {"quotation", "confirmed", "active", "closed"},
    "quotation": {"confirmed", "active", "closed"},
    "confirmed": {"active", "closed"},
    "active": {"paused", "closed"},
    "paused": {"active", "closed"},
    "closed": {"active"}  # Via renewal
}


def generate_subscription_number(db: Session) -> str:
    """
    Generates a human-readable unique subscription number in format:
    SUB-YYYY-0001
    """
    current_year = datetime.utcnow().year
    prefix = f"SUB-{current_year}-"

    # Find highest subscription number for current year
    highest = (
        db.query(Subscription.subscription_number)
        .filter(Subscription.subscription_number.like(f"{prefix}%"))
        .order_by(Subscription.subscription_number.desc())
        .first()
    )

    if highest and highest[0]:
        try:
            seq_part = highest[0].split("-")[-1]
            next_seq = int(seq_part) + 1
        except (ValueError, IndexError):
            count = db.query(Subscription).count() + 1
            next_seq = count
    else:
        next_seq = 1

    return f"{prefix}{next_seq:04d}"


def resolve_item_unit_price(db: Session, product_id: int, variant_id: Optional[int]) -> float:
    """
    Resolves snapshot unit price for a line item:
    product sales price + variant additional price (if variant is selected).
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product with ID {product_id} not found.")

    unit_price = product.sales_price
    if variant_id:
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id
        ).first()
        if not variant:
            raise ValueError(f"Variant with ID {variant_id} does not belong to Product {product_id}.")
        unit_price += variant.additional_price

    return round(unit_price, 2)


def create_subscription(
    db: Session,
    customer_id: int,
    plan_id: int,
    items_data: List[Dict[str, Any]],
    status: str = "draft",
    start_date: Optional[date] = None,
    expiry_date: Optional[date] = None,
    payment_terms: str = "Immediate",
    tax_percentage: float = 18.0,
    discount_amount: float = 0.0,
    notes: Optional[str] = None,
    auto_renew: bool = True
) -> Subscription:
    """
    Creates a new subscription with calculated item lines, snapshot pricing,
    financial totals, and initial billing schedule.
    """
    # 1. Verify Customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise ValueError(f"Customer with ID {customer_id} does not exist.")

    # 2. Verify Plan exists
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise ValueError(f"Plan with ID {plan_id} does not exist.")
    if not plan.is_active:
        raise ValueError(f"Plan '{plan.name}' is currently inactive.")

    effective_start = start_date or date.today()

    # 3. Process line items & capture unit prices
    if not items_data:
        raise ValueError("A subscription must contain at least one product line item.")

    processed_items = []
    prepared_items_calc = []
    total_qty = 0

    for itm in items_data:
        p_id = itm["product_id"]
        v_id = itm.get("variant_id")
        qty = itm.get("quantity", 1)

        if qty < 1:
            raise ValueError("Item quantity must be at least 1.")

        unit_price = resolve_item_unit_price(db, p_id, v_id)
        line_subtotal = calculate_line_item(unit_price, qty)

        total_qty += qty
        processed_items.append({
            "product_id": p_id,
            "variant_id": v_id,
            "quantity": qty,
            "unit_price": unit_price,
            "subtotal": line_subtotal
        })
        prepared_items_calc.append({
            "unit_price": unit_price,
            "quantity": qty
        })

    if total_qty < plan.minimum_quantity:
        raise ValueError(f"Total quantity ({total_qty}) does not meet plan's minimum required quantity ({plan.minimum_quantity}).")

    # 4. Calculate financial totals
    totals = calculate_subscription_totals(
        items=prepared_items_calc,
        plan_base_price=plan.price,
        tax_percentage=tax_percentage,
        discount_amount=discount_amount
    )

    # 5. Determine next billing date
    # When active, next billing date starts at start_date (first due)
    next_bill = effective_start if status == "active" else None

    # 6. Generate unique subscription number
    sub_num = generate_subscription_number(db)

    subscription = Subscription(
        subscription_number=sub_num,
        customer_id=customer_id,
        plan_id=plan_id,
        status=status.lower(),
        start_date=effective_start,
        expiry_date=expiry_date,
        next_billing_date=next_bill,
        payment_terms=payment_terms,
        subtotal=totals["subtotal"],
        tax_percentage=tax_percentage,
        tax_amount=totals["tax_amount"],
        discount_amount=totals["discount_amount"],
        total_amount=totals["total_amount"],
        notes=notes,
        auto_renew=auto_renew
    )

    db.add(subscription)
    db.flush()  # Flush to get subscription.id

    for item in processed_items:
        sub_item = SubscriptionItem(
            subscription_id=subscription.id,
            product_id=item["product_id"],
            variant_id=item["variant_id"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            subtotal=item["subtotal"]
        )
        db.add(sub_item)

    db.commit()
    db.refresh(subscription)
    return subscription


def transition_subscription_status(
    db: Session,
    subscription_id: int,
    new_status: str,
    reason: Optional[str] = None
) -> Subscription:
    """
    Safely transitions a subscription through its lifecycle states.
    draft -> quotation -> confirmed -> active -> paused -> closed
    """
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise ValueError(f"Subscription with ID {subscription_id} not found.")

    target = new_status.strip().lower()
    current = subscription.status.strip().lower()

    if target == current:
        return subscription

    allowed_targets = VALID_TRANSITIONS.get(current, set())
    if target not in allowed_targets:
        raise ValueError(
            f"Invalid status transition from '{current}' to '{target}'. "
            f"Allowed next states from '{current}': {', '.join(sorted(allowed_targets)) or 'None'}."
        )

    # State specific logic
    today = date.today()

    if target == "active":
        if not subscription.next_billing_date:
            # First billing date defaults to subscription start_date or today
            subscription.next_billing_date = subscription.start_date or today
        # Clear pause/close fields
        subscription.pause_date = None
        subscription.resume_date = today if current == "paused" else None
        subscription.closed_date = None
        subscription.close_reason = None

    elif target == "paused":
        if not subscription.plan.allow_pause:
            raise ValueError(f"The plan '{subscription.plan.name}' does not allow pausing.")
        subscription.pause_date = today

    elif target == "closed":
        subscription.closed_date = today
        subscription.close_reason = reason or "Closed by user/system."
        # If plan auto_close or manual closure
        subscription.next_billing_date = None

    subscription.status = target
    subscription.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)
    return subscription


def pause_subscription(db: Session, subscription_id: int) -> Subscription:
    """Pauses an active subscription."""
    return transition_subscription_status(db, subscription_id, "paused")


def resume_subscription(db: Session, subscription_id: int) -> Subscription:
    """
    Resumes a paused subscription and adjusts next_billing_date
    by the duration it was paused.
    """
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise ValueError(f"Subscription with ID {subscription_id} not found.")

    if subscription.status != "paused":
        raise ValueError(f"Cannot resume subscription with status '{subscription.status}'. Subscription must be paused.")

    today = date.today()
    if subscription.pause_date and subscription.next_billing_date:
        days_paused = max(0, (today - subscription.pause_date).days)
        subscription.next_billing_date = subscription.next_billing_date + timedelta(days=days_paused)

    return transition_subscription_status(db, subscription_id, "active")


def close_subscription(db: Session, subscription_id: int, reason: Optional[str] = None) -> Subscription:
    """Closes a subscription with an optional reason."""
    return transition_subscription_status(db, subscription_id, "closed", reason=reason)


def renew_subscription(db: Session, subscription_id: int) -> Subscription:
    """
    Renews an expired or closed subscription.
    Updates start_date to today, recomputes next_billing_date, and reactivates.
    """
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise ValueError(f"Subscription with ID {subscription_id} not found.")

    if not subscription.plan.allow_renewal:
        raise ValueError(f"Plan '{subscription.plan.name}' does not support renewal.")

    today = date.today()
    subscription.start_date = today
    subscription.next_billing_date = compute_next_billing_date(today, subscription.plan.billing_frequency)
    subscription.closed_date = None
    subscription.close_reason = None
    subscription.status = "active"
    subscription.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)
    return subscription


def convert_quotation_to_subscription(db: Session, subscription_id: int, activate: bool = True) -> Subscription:
    """
    Converts a quotation into a confirmed or active subscription.
    """
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise ValueError(f"Quotation with ID {subscription_id} not found.")

    if subscription.status != "quotation":
        raise ValueError(f"Record with ID {subscription_id} has status '{subscription.status}', expected 'quotation'.")

    target = "active" if activate else "confirmed"
    return transition_subscription_status(db, subscription_id, target)
