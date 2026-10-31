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
from app.services.billing_calculator import compute_billing_period, compute_next_billing_date
from app.services.subscription_service import (
    create_subscription as create_subscription_record,
    transition_subscription_status, pause_subscription, resume_subscription,
    close_subscription, renew_subscription, convert_quotation_to_subscription,
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def calculate_next_billing_date(start_date: datetime, frequency: str) -> datetime:
    """Calculate calendar-correct billing dates, preserving date/datetime input."""
    next_date = compute_next_billing_date(start_date.date() if isinstance(start_date, datetime) else start_date, frequency)
    return datetime.combine(next_date, start_date.time()) if isinstance(start_date, datetime) else next_date


def list_due_subscriptions(due_date, db: Session):
    cutoff = due_date.date() if isinstance(due_date, datetime) else due_date
    candidates = db.query(Subscription).filter(
        Subscription.status == "active", Subscription.next_billing_date.isnot(None)
    ).order_by(Subscription.next_billing_date.asc()).all()
    return [sub for sub in candidates if not sub.is_paused and
            (sub.next_billing_date.date() if isinstance(sub.next_billing_date, datetime) else sub.next_billing_date) <= cutoff]


def advance_billing_date(subscription_id: int, db: Session):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.next_billing_date = calculate_next_billing_date(sub.next_billing_date or sub.start_date, sub.plan.billing_frequency)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/due", response_model=List[SubscriptionResponse])
def due_subscriptions_endpoint(db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    return list_due_subscriptions(datetime.utcnow(), db)


@router.post("/{subscription_id}/advance-billing-date", response_model=SubscriptionResponse)
def advance_billing_date_endpoint(subscription_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    return advance_billing_date(subscription_id, db)


def _run_lifecycle(fn, subscription_id: int, db: Session, reason: Optional[str] = None):
    try:
        if fn is close_subscription:
            return fn(db, subscription_id, reason=reason)
        return fn(db, subscription_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{subscription_id}/pause", response_model=SubscriptionResponse)
def pause_subscription_endpoint(subscription_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    return _run_lifecycle(pause_subscription, subscription_id, db)


@router.post("/{subscription_id}/resume", response_model=SubscriptionResponse)
def resume_subscription_endpoint(subscription_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    return _run_lifecycle(resume_subscription, subscription_id, db)


@router.post("/{subscription_id}/close", response_model=SubscriptionResponse)
def close_subscription_endpoint(subscription_id: int, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    return _run_lifecycle(close_subscription, subscription_id, db, payload.get("reason"))


@router.post("/{subscription_id}/renew", response_model=SubscriptionResponse)
def renew_subscription_endpoint(subscription_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    return _run_lifecycle(renew_subscription, subscription_id, db)


@router.post("/{subscription_id}/convert-quote", response_model=SubscriptionResponse)
def convert_quote_endpoint(subscription_id: int, activate: bool = True, db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    try:
        return convert_quotation_to_subscription(db, subscription_id, activate=activate)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


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

    try:
        return create_subscription_record(
            db=db,
            customer_id=payload.customer_id,
            plan_id=payload.plan_id,
            items_data=[item.model_dump(exclude_none=True) for item in payload.items],
            status=(payload.status or "draft"),
            start_date=payload.start_date.date() if isinstance(payload.start_date, datetime) else payload.start_date,
            expiry_date=payload.expiry_date.date() if isinstance(payload.expiry_date, datetime) else payload.expiry_date,
            payment_terms=payload.payment_terms,
            tax_percentage=float(payload.tax_rate),
            discount_amount=float(payload.discount_amount or 0),
            notes=payload.notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


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

    try:
        return transition_subscription_status(db, subscription_id, new_status, reason=payload.reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
