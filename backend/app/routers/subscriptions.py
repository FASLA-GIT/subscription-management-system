from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_staff_or_admin
from app.models.customer import Customer
from app.models.plan import Plan
from app.models.product import Product, Variant
from app.models.subscription import Subscription, SubscriptionItem
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionStatusUpdate,
    SubscriptionUpdate,
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def calculate_next_billing_date(start_date: datetime, frequency: str) -> datetime:
    """Calculate the next billing date based on the plan frequency."""
    freq = frequency.lower()
    if freq == "daily":
        return start_date + timedelta(days=1)
    elif freq == "weekly":
        return start_date + timedelta(weeks=1)
    elif freq == "yearly":
        return start_date + timedelta(days=365)
    else:  # monthly default
        return start_date + timedelta(days=30)


@router.get("", response_model=List[SubscriptionResponse])
def list_subscriptions(
    status_filter: Optional[str] = Query(None, alias="status"),
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List subscriptions.
    - Admins and Staff see all subscriptions (filterable by status/customer).
    - Customers only see their own subscriptions.
    """
    query = db.query(Subscription)

    if current_user.role == "customer":
        if not current_user.customer:
            return []
        query = query.filter(Subscription.customer_id == current_user.customer.id)
    else:
        if customer_id:
            query = query.filter(Subscription.customer_id == customer_id)

    if status_filter:
        query = query.filter(Subscription.status == status_filter.lower())

    return query.order_by(Subscription.id.desc()).all()


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new subscription with line items.
    Customers can only create for their own customer_id.
    """
    # Customer scope check
    if current_user.role == "customer":
        if not current_user.customer or current_user.customer.id != payload.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create subscriptions for other customers.",
            )

    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    plan = db.query(Plan).filter(Plan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one product line item is required.")

    # Generate sequential unique subscription number
    count = db.query(Subscription).count() + 1
    sub_number = f"SUB-{datetime.utcnow().year}-{count:04d}"

    start_dt = payload.start_date or datetime.utcnow()
    next_bill = calculate_next_billing_date(start_dt, plan.billing_frequency)

    subscription = Subscription(
        subscription_number=sub_number,
        customer_id=customer.id,
        plan_id=plan.id,
        status="active",  # Direct activation for seamless workflow
        start_date=start_dt,
        expiry_date=payload.expiry_date,
        payment_terms=payload.payment_terms,
        next_billing_date=next_bill,
        tax_rate=payload.tax_rate,
        notes=payload.notes,
    )
    db.add(subscription)
    db.flush()

    subtotal = Decimal("0.00")

    for item_data in payload.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data.product_id} not found.")

        unit_price = Decimal(str(product.sales_price))
        if item_data.variant_id:
            variant = db.query(Variant).filter(
                Variant.id == item_data.variant_id,
                Variant.product_id == product.id
            ).first()
            if variant:
                unit_price += Decimal(str(variant.additional_price))

        total_price = unit_price * Decimal(item_data.quantity)
        subtotal += total_price

        sub_item = SubscriptionItem(
            subscription_id=subscription.id,
            product_id=product.id,
            variant_id=item_data.variant_id,
            quantity=item_data.quantity,
            unit_price=unit_price,
            total_price=total_price,
        )
        db.add(sub_item)

    # Tax calculation
    tax_amount = (subtotal * Decimal(str(payload.tax_rate))) / Decimal("100.00")
    total_amount = subtotal + tax_amount

    subscription.tax_amount = tax_amount
    subscription.total_amount = total_amount

    db.commit()
    db.refresh(subscription)
    return subscription


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get single subscription details."""
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    if current_user.role == "customer":
        if not current_user.customer or current_user.customer.id != sub.customer_id:
            raise HTTPException(status_code=403, detail="Access denied.")

    return sub


@router.patch("/{subscription_id}/status", response_model=SubscriptionResponse)
def update_subscription_status(
    subscription_id: int,
    payload: SubscriptionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Update subscription lifecycle status (draft, quotation, confirmed, active, closed)."""
    valid_statuses = ["draft", "quotation", "confirmed", "active", "closed", "paused"]
    new_status = payload.status.lower()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}."
        )

    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    sub.status = new_status
    if new_status == "paused":
        sub.is_paused = True
    elif new_status == "active":
        sub.is_paused = False

    db.commit()
    db.refresh(sub)
    return sub
