from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscription import Plan
from app.schemas.subscription import PlanCreate, PlanResponse

router = APIRouter(prefix="/plans", tags=["Subscription Plans"])

@router.get("", response_model=List[PlanResponse])
def list_plans(
    active_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Lists available subscription plans."""
    query = db.query(Plan)
    if active_only:
        query = query.filter(Plan.is_active == True)
    return query.all()

@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PlanCreate, db: Session = Depends(get_db)):
    """Creates a new subscription plan."""
    plan = Plan(
        name=payload.name,
        price=payload.price,
        billing_frequency=payload.billing_frequency,
        minimum_quantity=payload.minimum_quantity,
        start_date=payload.start_date,
        end_date=payload.end_date,
        auto_close=payload.auto_close,
        early_close=payload.early_close,
        pause_enabled=payload.pause_enabled,
        renewal_enabled=payload.renewal_enabled,
        is_active=payload.is_active
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.get("/{id}", response_model=PlanResponse)
def get_plan(id: int, db: Session = Depends(get_db)):
    """Retrieves plan details by ID."""
    plan = db.query(Plan).filter(Plan.id == id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")
    return plan
