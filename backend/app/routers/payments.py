from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.finance import Payment, PaymentMethod
from app.schemas.finance import PaymentCreate, PaymentResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentResponse])
def list_payments(
    invoice_id: Optional[int] = Query(None, description="Filter by invoice ID"),
    payment_method: Optional[PaymentMethod] = Query(None, description="Filter by payment method"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Lists recorded payments with optional filters."""
    query = db.query(Payment)

    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)

    if payment_method:
        query = query.filter(Payment.payment_method == payment_method)

    return query.order_by(Payment.payment_date.desc(), Payment.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db)
):
    """
    Records a payment against an invoice.
    - Validates positive amount.
    - Verifies amount does not exceed invoice outstanding balance.
    - Automatically updates invoice amount_paid, outstanding_amount, and status (e.g. to PAID or PARTIALLY_PAID).
    """
    return PaymentService.record_payment(
        db=db,
        invoice_id=payload.invoice_id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        payment_date=payload.payment_date,
        transaction_reference=payload.transaction_reference,
        notes=payload.notes
    )

@router.get("/{id}", response_model=PaymentResponse)
def get_payment(id: int, db: Session = Depends(get_db)):
    """Retrieves payment receipt details by ID."""
    payment = db.query(Payment).filter(Payment.id == id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {id} not found."
        )
    return payment
