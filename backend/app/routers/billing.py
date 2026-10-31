from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.finance import Invoice, InvoiceStatus
from app.models.subscription import Subscription
from app.schemas.finance import (
    InvoiceResponse, InvoiceDetailResponse, InvoiceStatusUpdate,
    GenerateDueRequest, GenerateDueResponse, SkippedInvoiceInfo
)
from app.schemas.common import MessageResponse
from app.services.billing_service import BillingService

router = APIRouter(prefix="", tags=["Billing & Invoices"])

@router.post("/billing/generate-due", response_model=GenerateDueResponse)
def generate_due_invoices(
    req: GenerateDueRequest = GenerateDueRequest(),
    db: Session = Depends(get_db)
):
    """
    Automatic Invoice Generation endpoint:
    Scans all active subscriptions that are due for billing up to as_of_date.
    - Prevents duplicate invoices for the same subscription and period.
    - Computes taxes automatically.
    - Evaluates and applies best discounts where eligible.
    - Advances subscription next billing date.
    """
    generated, skipped, total_invoiced = BillingService.generate_all_due_invoices(
        db=db,
        as_of_date=req.as_of_date,
        auto_discount=req.apply_best_discount
    )

    return GenerateDueResponse(
        generated_count=len(generated),
        skipped_count=len(skipped),
        total_invoiced_amount=total_invoiced,
        generated_invoices=generated,
        skipped_subscriptions=[SkippedInvoiceInfo(**s) for s in skipped]
    )

@router.post("/billing/generate/{subscription_id}", response_model=InvoiceResponse)
def generate_subscription_invoice(
    subscription_id: int,
    discount_code: Optional[str] = Query(None, description="Optional discount code to apply"),
    as_of_date: Optional[date] = Query(None, description="Billing as of date"),
    db: Session = Depends(get_db)
):
    """Generates an invoice on-demand for a single specific subscription."""
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {subscription_id} not found."
        )

    invoice, error_msg = BillingService.generate_invoice_for_subscription(
        db=db,
        subscription=sub,
        as_of_date=as_of_date or date.today(),
        discount_code=discount_code,
        auto_discount=True if not discount_code else False
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    return invoice

@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(
    status_filter: Optional[InvoiceStatus] = Query(None, alias="status"),
    customer_id: Optional[int] = Query(None),
    subscription_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None, description="Search invoice number or customer name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieves all invoices with filtering and pagination."""
    query = db.query(Invoice)

    if status_filter:
        query = query.filter(Invoice.status == status_filter)

    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)

    if subscription_id:
        query = query.filter(Invoice.subscription_id == subscription_id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(Invoice.invoice_number.ilike(search_term))

    return query.order_by(Invoice.issue_date.desc(), Invoice.id.desc()).offset(skip).limit(limit).all()

@router.get("/invoices/{id}", response_model=InvoiceDetailResponse)
def get_invoice_detail(id: int, db: Session = Depends(get_db)):
    """Retrieves complete details of an invoice including items, payments, and discounts."""
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID {id} not found."
        )
    return invoice

@router.patch("/invoices/{id}/status", response_model=InvoiceResponse)
def update_invoice_status(
    id: int,
    payload: InvoiceStatusUpdate,
    db: Session = Depends(get_db)
):
    """Updates the status of an invoice (e.g. to CANCELLED or CONFIRMED)."""
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID {id} not found."
        )

    invoice.status = payload.status
    if payload.notes:
        invoice.notes = (invoice.notes or "") + f"\n[Status Change]: {payload.notes}"

    db.commit()
    db.refresh(invoice)
    return invoice
