from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.finance import Invoice, Payment, InvoiceStatus, PaymentMethod

class PaymentService:
    @classmethod
    def generate_payment_number(cls, db: Session) -> str:
        """Generates a guaranteed unique sequential payment receipt number: PAY-YYYYMM-XXXX"""
        now = date.today()
        prefix = f"PAY-{now.strftime('%Y%m')}-"
        count = db.query(func.count(Payment.id)).filter(Payment.payment_number.like(f"{prefix}%")).scalar() or 0
        seq = count + 1
        return f"{prefix}{seq:04d}"

    @classmethod
    def record_payment(
        cls,
        db: Session,
        invoice_id: int,
        amount: Decimal,
        payment_method: PaymentMethod = PaymentMethod.BANK_TRANSFER,
        payment_date: Optional[date] = None,
        transaction_reference: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Payment:
        """
        Records a payment against an invoice.
        Enforces:
        - Invoice must exist and not be cancelled.
        - Payment amount must be positive.
        - Payment cannot exceed the current outstanding amount.
        - Automatically updates invoice amount_paid, outstanding_amount, and status.
        """
        if payment_date is None:
            payment_date = date.today()

        # Validate amount
        amt = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if amt <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than zero."
            )

        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Invoice with ID {invoice_id} not found."
            )

        if invoice.status == InvoiceStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot record payment on cancelled invoice {invoice.invoice_number}."
            )

        current_outstanding = Decimal(str(invoice.outstanding_amount))
        if current_outstanding <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invoice {invoice.invoice_number} is already fully paid."
            )

        if amt > current_outstanding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount (₹{amt}) exceeds current outstanding balance of ₹{current_outstanding}."
            )

        # 1. Create Payment record
        payment_number = cls.generate_payment_number(db)
        payment = Payment(
            payment_number=payment_number,
            invoice_id=invoice.id,
            amount=amt,
            payment_method=payment_method,
            payment_date=payment_date,
            transaction_reference=transaction_reference,
            notes=notes
        )
        db.add(payment)

        # 2. Update Invoice financial balances
        new_paid = (Decimal(str(invoice.amount_paid)) + amt).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        new_outstanding = (Decimal(str(invoice.total_amount)) - new_paid).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        invoice.amount_paid = new_paid
        invoice.outstanding_amount = max(Decimal("0.00"), new_outstanding)

        # 3. Determine new Invoice status
        if invoice.outstanding_amount <= Decimal("0.00"):
            invoice.status = InvoiceStatus.PAID
        elif invoice.amount_paid > Decimal("0.00"):
            invoice.status = InvoiceStatus.PARTIALLY_PAID
        elif invoice.due_date < date.today():
            invoice.status = InvoiceStatus.OVERDUE

        db.commit()
        db.refresh(payment)
        db.refresh(invoice)
        return payment

    @classmethod
    def get_invoice_payments(cls, db: Session, invoice_id: int) -> List[Payment]:
        """Returns all payments made for a given invoice."""
        return db.query(Payment).filter(Payment.invoice_id == invoice_id).order_by(Payment.payment_date.desc()).all()
