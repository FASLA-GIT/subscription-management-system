from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse


router = APIRouter(prefix="/api/plans", tags=["Subscription Plans"])


@router.get("", response_model=List[PlanResponse], summary="List all subscription plans")
def list_plans(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    billing_frequency: Optional[str] = Query(None, description="Filter by frequency: daily, weekly, monthly, yearly"),
    db: Session = Depends(get_db)
):
    """
    Returns all subscription plans, with optional filtering by active status or billing frequency.
    """
    query = db.query(Plan)
    if is_active is not None:
        query = query.filter(Plan.is_active == is_active)
    if billing_frequency:
        query = query.filter(Plan.billing_frequency == billing_frequency.strip().lower())

    return query.order_by(Plan.price.asc()).all()


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED, summary="Create a subscription plan")
def create_plan(plan_in: PlanCreate, db: Session = Depends(get_db)):
    """
    Creates a new subscription plan with billing frequency (daily, weekly, monthly, yearly)
    and lifecycle policies (pause, renewal, early closure).
    """
    plan = Plan(
        name=plan_in.name,
        price=plan_in.price,
        billing_frequency=plan_in.billing_frequency,
        minimum_quantity=plan_in.minimum_quantity,
        availability_start_date=plan_in.availability_start_date,
        availability_end_date=plan_in.availability_end_date,
        auto_close=plan_in.auto_close,
        allow_early_closure=plan_in.allow_early_closure,
        allow_pause=plan_in.allow_pause,
        allow_renewal=plan_in.allow_renewal,
        is_active=plan_in.is_active
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=PlanResponse, summary="Get plan details")
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Retrieves details for a specific subscription plan.
    """
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found."
        )
    return plan


@router.put("/{plan_id}", response_model=PlanResponse, summary="Update a subscription plan")
def update_plan(plan_id: int, plan_in: PlanUpdate, db: Session = Depends(get_db)):
    """
    Updates an existing plan's parameters.
    """
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found."
        )

    update_data = plan_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plan, key, value)

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_200_OK, summary="Delete or deactivate a plan")
def delete_plan(plan_id: int, hard_delete: bool = False, db: Session = Depends(get_db)):
    """
    Deactivates a plan by default, or deletes it if requested.
    """
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found."
        )

    if hard_delete:
        db.delete(plan)
    else:
        plan.is_active = False

    db.commit()
    return {"message": f"Plan {plan_id} {'deleted' if hard_delete else 'deactivated'} successfully."}
