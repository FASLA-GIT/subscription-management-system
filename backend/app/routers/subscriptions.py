from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.subscription import Subscription
from app.models.customer import Customer
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionStatusUpdate,
    SubscriptionCloseRequest
)
from app.services.subscription_service import (
    create_subscription,
    transition_subscription_status,
    pause_subscription,
    resume_subscription,
    close_subscription,
    renew_subscription,
    convert_quotation_to_subscription
)
from app.services.billing_calculator import compute_next_billing_date


router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])


@router.get("", response_model=List[SubscriptionResponse], summary="List subscriptions with filters")
def list_subscriptions(
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    status: Optional[str] = Query(None, description="Filter by status: draft, quotation, confirmed, active, paused, closed"),
    plan_id: Optional[int] = Query(None, description="Filter by plan ID"),
    due_only: bool = Query(False, description="Filter for active subscriptions due for billing on or before today"),
    search: Optional[str] = Query(None, description="Search by subscription number"),
    db: Session = Depends(get_db)
):
    """
    Returns subscriptions based on lifecycle status, customer, plan, or due date.
    """
    query = db.query(Subscription)

    if customer_id:
        query = query.filter(Subscription.customer_id == customer_id)
    if status:
        query = query.filter(Subscription.status == status.strip().lower())
    if plan_id:
        query = query.filter(Subscription.plan_id == plan_id)
    if due_only:
        today = date.today()
        query = query.filter(
            Subscription.status == "active",
            Subscription.next_billing_date <= today
        )
    if search:
        query = query.filter(Subscription.subscription_number.ilike(f"%{search}%"))

    return query.order_by(Subscription.id.desc()).all()


@router.get("/due", response_model=List[SubscriptionResponse], summary="List subscriptions due for billing")
def list_due_subscriptions(
    due_date: Optional[date] = Query(None, description="Target date to evaluate dues (defaults to today)"),
    db: Session = Depends(get_db)
):
    """
    Direct helper endpoint for the Finance module (Iha) to identify all active
    subscriptions that require invoice generation.
    """
    target_date = due_date or date.today()
    return (
        db.query(Subscription)
        .filter(
            Subscription.status == "active",
            Subscription.next_billing_date != None,
            Subscription.next_billing_date <= target_date
        )
        .order_by(Subscription.next_billing_date.asc())
        .all()
    )


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED, summary="Create a new subscription")
def create_new_subscription(sub_in: SubscriptionCreate, db: Session = Depends(get_db)):
    """
    Creates a new subscription with line items, calculates financial breakdown,
    and sets initial status (draft, quotation, confirmed, active).
    """
    try:
        items_payload = [item.model_dump() for item in sub_in.items]
        subscription = create_subscription(
            db=db,
            customer_id=sub_in.customer_id,
            plan_id=sub_in.plan_id,
            items_data=items_payload,
            status=sub_in.status,
            start_date=sub_in.start_date,
            expiry_date=sub_in.expiry_date,
            payment_terms=sub_in.payment_terms,
            tax_percentage=sub_in.tax_percentage,
            discount_amount=sub_in.discount_amount,
            notes=sub_in.notes,
            auto_renew=sub_in.auto_renew
        )
        return subscription
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.get("/{subscription_id}", response_model=SubscriptionResponse, summary="Get subscription by ID")
def get_subscription(subscription_id: int, db: Session = Depends(get_db)):
    """
    Retrieves complete details of a subscription including customer, plan, and product items.
    """
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {subscription_id} not found."
        )
    return sub


@router.patch("/{subscription_id}/status", response_model=SubscriptionResponse, summary="Update subscription lifecycle status")
def update_status(subscription_id: int, status_in: SubscriptionStatusUpdate, db: Session = Depends(get_db)):
    """
    Transitions subscription between lifecycle states:
    draft -> quotation -> confirmed -> active -> paused -> closed
    """
    try:
        return transition_subscription_status(
            db=db,
            subscription_id=subscription_id,
            new_status=status_in.status,
            reason=status_in.reason
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/{subscription_id}/pause", response_model=SubscriptionResponse, summary="Pause an active subscription")
def pause(subscription_id: int, db: Session = Depends(get_db)):
    """
    Pauses an active subscription, recording the pause date and preventing billing.
    """
    try:
        return pause_subscription(db, subscription_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/{subscription_id}/resume", response_model=SubscriptionResponse, summary="Resume a paused subscription")
def resume(subscription_id: int, db: Session = Depends(get_db)):
    """
    Resumes a paused subscription and adjusts next_billing_date by pause duration.
    """
    try:
        return resume_subscription(db, subscription_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/{subscription_id}/renew", response_model=SubscriptionResponse, summary="Renew an expired or closed subscription")
def renew(subscription_id: int, db: Session = Depends(get_db)):
    """
    Renews a closed or expired subscription, advancing start date and next billing date.
    """
    try:
        return renew_subscription(db, subscription_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/{subscription_id}/close", response_model=SubscriptionResponse, summary="Close a subscription")
def close(subscription_id: int, close_in: SubscriptionCloseRequest = None, db: Session = Depends(get_db)):
    """
    Closes a subscription with an optional reason.
    """
    try:
        reason = close_in.reason if close_in else None
        return close_subscription(db, subscription_id, reason=reason)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/{subscription_id}/convert-quote", response_model=SubscriptionResponse, summary="Convert quotation to active subscription")
def convert_quote(subscription_id: int, activate: bool = True, db: Session = Depends(get_db)):
    """
    Converts a quotation to confirmed or active status upon customer acceptance.
    """
    try:
        return convert_quotation_to_subscription(db, subscription_id, activate=activate)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/{subscription_id}/advance-billing-date", response_model=SubscriptionResponse, summary="Advance next billing date after invoice generation")
def advance_billing_date(subscription_id: int, db: Session = Depends(get_db)):
    """
    Used by the Finance module (Iha) after generating an invoice for this subscription:
    advances next_billing_date based on the plan's frequency (daily, weekly, monthly, yearly).
    """
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

    if not sub.next_billing_date:
        sub.next_billing_date = sub.start_date or date.today()

    sub.next_billing_date = compute_next_billing_date(sub.next_billing_date, sub.plan.billing_frequency)
    db.commit()
    db.refresh(sub)
    return sub
