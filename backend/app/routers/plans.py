from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin
from app.models.plan import Plan
from app.models.user import User
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate

router = APIRouter(prefix="/plans", tags=["Subscription Plans"])


@router.get("", response_model=List[PlanResponse])
def list_plans(
    is_active: Optional[bool] = Query(None),
    billing_frequency: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List subscription plans. Available to all authenticated users."""
    query = db.query(Plan)
    if is_active is not None:
        query = query.filter(Plan.is_active == is_active)
    if billing_frequency:
        query = query.filter(Plan.billing_frequency == billing_frequency.lower())

    return query.order_by(Plan.price.asc()).all()


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    payload: PlanCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin endpoint to create a subscription plan."""
    valid_frequencies = ["daily", "weekly", "monthly", "yearly"]
    if payload.billing_frequency.lower() not in valid_frequencies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Billing frequency must be one of: {', '.join(valid_frequencies)}.",
        )

    plan_data = payload.model_dump()
    plan_data["billing_frequency"] = plan_data["billing_frequency"].lower()
    plan = Plan(**plan_data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get single plan by ID."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found.",
        )
    return plan


@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin endpoint to update plan details."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "billing_frequency" in update_data and update_data["billing_frequency"]:
        freq = update_data["billing_frequency"].lower()
        if freq not in ["daily", "weekly", "monthly", "yearly"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Billing frequency must be daily, weekly, monthly, or yearly.",
            )
        update_data["billing_frequency"] = freq

    for field, val in update_data.items():
        setattr(plan, field, val)

    db.commit()
    db.refresh(plan)
    return plan
