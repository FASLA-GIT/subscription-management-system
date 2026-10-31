from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.subscription import (
    Subscription, SubscriptionItem, SubscriptionStatus, Plan, Product, Variant
)
from app.schemas.subscription import (
    SubscriptionCreate, SubscriptionResponse
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

class SubscriptionStatusUpdate(BaseModel):
    status: SubscriptionStatus
    notes: Optional[str] = None

@router.get("", response_model=List[SubscriptionResponse])
def list_subscriptions(
    status_filter: Optional[SubscriptionStatus] = Query(None, alias="status"),
    customer_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Lists subscriptions with optional status and customer filter."""
    query = db.query(Subscription)
    if status_filter:
        query = query.filter(Subscription.status == status_filter)
    if customer_id:
        query = query.filter(Subscription.customer_id == customer_id)
    return query.order_by(Subscription.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db)
):
    """Creates a new customer subscription."""
    plan = db.query(Plan).filter(Plan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    # Generate sequential unique subscription number SUB-YYYYMM-XXXX
    prefix = f"SUB-{date.today().strftime('%Y%m')}-"
    count = db.query(func.count(Subscription.id)).filter(Subscription.subscription_number.like(f"{prefix}%")).scalar() or 0
    sub_num = f"{prefix}{count + 1:04d}"

    # Calculate initial totals
    total_amount = Decimal("0.00")
    total_qty = 0

    sub = Subscription(
        subscription_number=sub_num,
        customer_id=payload.customer_id,
        plan_id=payload.plan_id,
        status=SubscriptionStatus.ACTIVE,  # Default to active so it can be billed
        start_date=payload.start_date or date.today(),
        expiry_date=payload.expiry_date,
        next_billing_date=payload.start_date or date.today(),
        payment_terms=payload.payment_terms,
        auto_renew=payload.auto_renew,
        notes=payload.notes,
        tax_rate=Decimal("18.00")
    )
    db.add(sub)
    db.flush()

    if payload.items:
        for it in payload.items:
            unit_price = Decimal(str(it.unit_price))
            add_price = Decimal(str(it.additional_price))
            effective_price = unit_price + add_price
            line_tot = (effective_price * Decimal(str(it.quantity))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            
            sub_item = SubscriptionItem(
                subscription_id=sub.id,
                product_id=it.product_id,
                variant_id=it.variant_id,
                quantity=it.quantity,
                unit_price=unit_price,
                additional_price=add_price,
                line_total=line_tot
            )
            db.add(sub_item)
            total_amount += line_tot
            total_qty += it.quantity
    else:
        # Default single item from plan price
        base_price = Decimal(str(plan.price))
        total_amount = base_price
        total_qty = 1

    sub.quantity = total_qty
    sub.unit_price = (total_amount / Decimal(str(total_qty))).quantize(Decimal("0.01")) if total_qty > 0 else total_amount
    sub.total_amount = total_amount

    db.commit()
    db.refresh(sub)
    return sub

@router.get("/{id}", response_model=SubscriptionResponse)
def get_subscription(id: int, db: Session = Depends(get_db)):
    """Retrieves subscription details by ID."""
    sub = db.query(Subscription).filter(Subscription.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
    return sub

@router.patch("/{id}/status", response_model=SubscriptionResponse)
def update_subscription_status(
    id: int,
    payload: SubscriptionStatusUpdate,
    db: Session = Depends(get_db)
):
    """Updates subscription status (e.g. active, paused, closed)."""
    sub = db.query(Subscription).filter(Subscription.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
    sub.status = payload.status
    if payload.notes:
        sub.notes = (sub.notes or "") + f"\n[Status Update]: {payload.notes}"
    db.commit()
    db.refresh(sub)
    return sub
