from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_staff_or_admin
from app.models.customer import Customer
from app.models.discount import Discount
from app.models.invoice import Invoice, InvoiceItem
from app.models.subscription import Subscription
from app.models.user import User
from app.routers.subscriptions import calculate_next_billing_date
from app.schemas.finance import (
    BillingGenerateDueRequest,
    BillingGenerateDueResponse,
    InvoiceResponse,
)

router = APIRouter(prefix="/billing", tags=["Billing & Invoices"])


@router.post("/generate-due", response_model=BillingGenerateDueResponse)
def generate_due_invoices(
    payload: Optional[BillingGenerateDueRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Automatically generate invoices for all due active subscriptions.
    - Prevents duplicate invoices for the same subscription and billing period.
    - Accurately calculates subtotal, discounts, and taxes using exact Decimals.
    - Advances next_billing_date for processed subscriptions.
    """
    ref_date = payload.reference_date if payload and payload.reference_date else datetime.utcnow()

    # Find active subscriptions that are due
    due_subs = (
        db.query(Subscription)
        .filter(
            Subscription.status == "active",
            Subscription.is_paused == False,
            Subscription.next_billing_date <= ref_date,
        )
        .all()
    )

    generated_ids = []
    skipped_count = 0

    for sub in due_subs:
        period_start = sub.start_date
        period_end = sub.next_billing_date or (period_start + timedelta(days=30))

        # Duplicate check: check if an invoice already exists for this subscription and period
        existing_invoice = (
            db.query(Invoice)
            .filter(
                Invoice.subscription_id == sub.id,
                Invoice.billing_period_start == period_start,
                Invoice.billing_period_end == period_end,
            )
            .first()
        )
        if existing_invoice:
            skipped_count += 1
            continue

        # Generate invoice number
        count = db.query(Invoice).count() + 1
        inv_number = f"INV-{datetime.utcnow().year}-{count:04d}"

        # Calculate line items
        subtotal = Decimal("0.00")
        invoice_items = []
        for item in sub.items:
            unit_price = Decimal(str(item.unit_price))
            total_price = Decimal(str(item.total_price))
            subtotal += total_price

            desc = f"{item.product.name}"
            if item.variant:
                desc += f" ({item.variant.variant_name})"

            invoice_items.append(
                InvoiceItem(
                    product_id=item.product_id,
                    variant_id=item.variant_id,
                    description=desc,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                )
            )

        # Check for applicable active discount
        discount_amount = Decimal("0.00")
        applied_discount_id = None
        now_dt = datetime.utcnow()
        active_discount = (
            db.query(Discount)
            .filter(
                Discount.is_active == True,
                (Discount.start_date == None) | (Discount.start_date <= now_dt),
                (Discount.end_date == None) | (Discount.end_date >= now_dt),
                (Discount.usage_limit == None) | (Discount.times_used < Discount.usage_limit),
                Discount.min_purchase_amount <= subtotal,
            )
            .order_by(Discount.value.desc())
            .first()
        )

        if active_discount:
            applied_discount_id = active_discount.id
            if active_discount.discount_type == "percentage":
                discount_amount = (subtotal * Decimal(str(active_discount.value))) / Decimal("100.00")
            else:
                discount_amount = min(Decimal(str(active_discount.value)), subtotal)
            active_discount.times_used += 1

        taxable_amount = max(Decimal("0.00"), subtotal - discount_amount)
        tax_amount = (taxable_amount * Decimal(str(sub.tax_rate))) / Decimal("100.00")
        total_amount = taxable_amount + tax_amount

        due_date = period_end + timedelta(days=15)

        new_invoice = Invoice(
            invoice_number=inv_number,
            customer_id=sub.customer_id,
            subscription_id=sub.id,
            billing_period_start=period_start,
            billing_period_end=period_end,
            subtotal=subtotal,
            discount_amount=discount_amount,
            discount_id=applied_discount_id,
            tax_rate=sub.tax_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            amount_paid=Decimal("0.00"),
            balance_due=total_amount,
            issue_date=datetime.utcnow(),
            due_date=due_date,
            status="confirmed",
            notes=f"Auto-generated for subscription {sub.subscription_number}",
            items=invoice_items,
        )
        db.add(new_invoice)
        db.flush()

        # Advance subscription next_billing_date
        sub.start_date = period_end
        sub.next_billing_date = calculate_next_billing_date(period_end, sub.plan.billing_frequency)
        generated_ids.append(new_invoice.id)

    db.commit()

    return BillingGenerateDueResponse(
        generated_count=len(generated_ids),
        invoice_ids=generated_ids,
        skipped_count=skipped_count,
        message=f"Generated {len(generated_ids)} invoice(s). Skipped {skipped_count} duplicate(s).",
    )


@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(
    status_filter: Optional[str] = Query(None, alias="status"),
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List invoices. Customers only see their own invoices."""
    query = db.query(Invoice)
    if current_user.role == "customer":
        if not current_user.customer:
            return []
        query = query.filter(Invoice.customer_id == current_user.customer.id)
    else:
        if customer_id:
            query = query.filter(Invoice.customer_id == customer_id)

    if status_filter:
        query = query.filter(Invoice.status == status_filter.lower())

    return query.order_by(Invoice.id.desc()).all()


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve invoice details with line items."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if current_user.role == "customer":
        if not current_user.customer or current_user.customer.id != invoice.customer_id:
            raise HTTPException(status_code=403, detail="Access denied.")

    return invoice
