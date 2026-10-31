from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_staff_or_admin
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.user import User
from app.schemas.finance import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    invoice_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List payment records.
    - Admins and Staff see all payments.
    - Customers only see payments linked to their own invoices.
    """
    query = db.query(Payment).join(Invoice)

    if current_user.role == "customer":
        if not current_user.customer:
            return []
        query = query.filter(Invoice.customer_id == current_user.customer.id)

    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)

    return query.order_by(Payment.payment_date.desc()).all()


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Record a payment towards an invoice.
    - Updates invoice amount_paid and balance_due.
    - Sets invoice status to 'paid' when fully settled.
    - Supports partial payments.
    """
    invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID {payload.invoice_id} not found.",
        )

    if invoice.status == "paid" or invoice.balance_due <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invoice has already been fully paid.",
        )
    if invoice.status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot record payment on a cancelled invoice.")

    payment_amount = Decimal(str(payload.amount))
    if payment_amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero.",
        )

    # Prevent paying more than balance due
    if payment_amount > invoice.balance_due:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount ({payment_amount}) exceeds outstanding balance ({invoice.balance_due}).",
        )

    payment = Payment(
        invoice_id=invoice.id,
        payment_method=payload.payment_method,
        amount=payment_amount,
        payment_date=payload.payment_date,
        reference_number=payload.reference_number,
        notes=payload.notes,
    )
    db.add(payment)

    # Update invoice financials
    invoice.amount_paid += payment_amount
    invoice.balance_due = max(Decimal("0.00"), invoice.total_amount - invoice.amount_paid)

    if invoice.balance_due == Decimal("0.00"):
        invoice.status = "paid"
    else:
        invoice.status = "partially_paid"

    db.commit()
    db.refresh(payment)
    return payment
