from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
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
from app.services.billing_calculator import compute_billing_period, compute_next_billing_date
from app.schemas.finance import (
    BillingGenerateDueRequest,
    BillingGenerateDueResponse,
    InvoiceResponse,
)

router = APIRouter(prefix="/billing", tags=["Billing & Invoices"])
invoices_router = APIRouter(prefix="/invoices", tags=["Billing & Invoices"])


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
    ref_day = ref_date.date() if isinstance(ref_date, datetime) else ref_date

    # Find active subscriptions that are due
    due_subs = (
        db.query(Subscription)
        .filter(
            Subscription.status == "active",
            Subscription.is_paused == False,
        )
        .all()
    )
    due_subs = [s for s in due_subs if s.next_billing_date and
                (s.next_billing_date.date() if isinstance(s.next_billing_date, datetime) else s.next_billing_date) <= ref_day]

    generated_ids = []
    skipped_count = 0

    for sub in due_subs:
        scheduled = sub.next_billing_date
        next_due = scheduled.date() if isinstance(scheduled, datetime) else scheduled
        period_start = sub.start_date.date() if isinstance(sub.start_date, datetime) else sub.start_date
        period_start = period_start or next_due
        period_end = (next_due - timedelta(days=1)) if next_due and next_due > period_start else compute_billing_period(period_start, sub.plan.billing_frequency)[1]

        # Duplicate check: check if an invoice already exists for this subscription and period
        existing_invoice = (
            db.query(Invoice)
            .filter(
                Invoice.subscription_id == sub.id,
                Invoice.billing_period_start == datetime.combine(period_start, datetime.min.time()),
                Invoice.billing_period_end == datetime.combine(period_end, datetime.min.time()),
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
            unit_price = Decimal(str(item.unit_price)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_price = Decimal(str(item.total_price)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
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
        quantity = sum(item.quantity for item in sub.items)
        product_ids = {item.product_id for item in sub.items}
        best_discount = None
        for candidate in db.query(Discount).filter(Discount.is_active.is_(True)).all():
            start_day = candidate.start_date.date() if candidate.start_date and isinstance(candidate.start_date, datetime) else candidate.start_date
            end_day = candidate.end_date.date() if candidate.end_date and isinstance(candidate.end_date, datetime) else candidate.end_date
            if start_day and start_day > ref_day or end_day and end_day < ref_day:
                continue
            if candidate.usage_limit is not None and candidate.times_used >= candidate.usage_limit:
                continue
            if subtotal < candidate.min_purchase_amount or quantity < candidate.min_quantity:
                continue
            if candidate.applicable_product_id and candidate.applicable_product_id not in product_ids:
                continue
            if candidate.applicable_plan_id and candidate.applicable_plan_id != sub.plan_id:
                continue
            if candidate.discount_type == "percentage":
                savings = (subtotal * Decimal(str(candidate.value)) / Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            else:
                savings = min(Decimal(str(candidate.value)), subtotal)
            if savings > discount_amount:
                best_discount, discount_amount = candidate, savings

        if best_discount:
            applied_discount_id = best_discount.id
            best_discount.times_used += 1

        taxable_amount = max(Decimal("0.00"), subtotal - discount_amount)
        tax_amount = (taxable_amount * Decimal(str(sub.tax_rate)) / Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_amount = (taxable_amount + tax_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        due_date = period_end + timedelta(days=15)

        new_invoice = Invoice(
            invoice_number=inv_number,
            customer_id=sub.customer_id,
            subscription_id=sub.id,
            billing_period_start=datetime.combine(period_start, datetime.min.time()),
            billing_period_end=datetime.combine(period_end, datetime.min.time()),
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
        sub.start_date = datetime.combine(next_due, datetime.min.time())
        following_due = compute_next_billing_date(next_due, sub.plan.billing_frequency)
        sub.next_billing_date = datetime.combine(following_due, datetime.min.time())
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


@invoices_router.get("", response_model=List[InvoiceResponse])
def list_invoices_contract(status_filter: Optional[str] = Query(None, alias="status"), customer_id: Optional[int] = None,
                           db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return list_invoices(status_filter=status_filter, customer_id=customer_id, db=db, current_user=current_user)


@invoices_router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice_contract(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return get_invoice(invoice_id=invoice_id, db=db, current_user=current_user)


@invoices_router.patch("/{invoice_id}/status", response_model=InvoiceResponse)
def update_invoice_status(invoice_id: int, payload: dict, db: Session = Depends(get_db),
                          current_user: User = Depends(require_staff_or_admin)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    new_status = str(payload.get("status", "")).strip().lower()
    if new_status not in {"draft", "confirmed", "paid", "partially_paid", "overdue", "cancelled"}:
        raise HTTPException(status_code=400, detail="Invalid invoice status")
    if invoice.balance_due > Decimal("0.00") and new_status == "paid":
        raise HTTPException(status_code=400, detail="An invoice with an outstanding balance cannot be marked paid")
    invoice.status = new_status
    db.commit()
    db.refresh(invoice)
    return invoice
