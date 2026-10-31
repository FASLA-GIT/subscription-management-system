from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.finance import Discount
from app.schemas.finance import DiscountCreate, DiscountUpdate, DiscountResponse
from app.services.discount_service import DiscountService

router = APIRouter(prefix="/discounts", tags=["Discounts"])

class DiscountValidateRequest(BaseModel):
    code: str
    subtotal: Decimal
    quantity: int = 1
    plan_id: Optional[int] = None
    product_id: Optional[int] = None

class DiscountValidateResponse(BaseModel):
    valid: bool
    message: str
    discount_amount: Decimal = Decimal("0.00")
    discount: Optional[DiscountResponse] = None

@router.get("", response_model=List[DiscountResponse])
def list_discounts(
    active_only: bool = Query(False, description="Filter for only active discounts"),
    db: Session = Depends(get_db)
):
    """Lists all discount rules."""
    query = db.query(Discount)
    if active_only:
        query = query.filter(Discount.is_active == True)
    return query.order_by(Discount.created_at.desc()).all()

@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    payload: DiscountCreate,
    db: Session = Depends(get_db)
):
    """Creates a new discount rule (Admin only)."""
    existing = db.query(Discount).filter(Discount.code == payload.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Discount code '{payload.code}' already exists."
        )

    discount = Discount(
        code=payload.code,
        name=payload.name,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_purchase_amount=payload.min_purchase_amount,
        min_quantity=payload.min_quantity,
        start_date=payload.start_date,
        end_date=payload.end_date,
        max_uses=payload.max_uses,
        is_active=payload.is_active,
        applicable_product_id=payload.applicable_product_id,
        applicable_plan_id=payload.applicable_plan_id
    )
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount

@router.get("/{id}", response_model=DiscountResponse)
def get_discount(id: int, db: Session = Depends(get_db)):
    """Retrieves discount details by ID."""
    discount = db.query(Discount).filter(Discount.id == id).first()
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with ID {id} not found."
        )
    return discount

@router.put("/{id}", response_model=DiscountResponse)
def update_discount(
    id: int,
    payload: DiscountUpdate,
    db: Session = Depends(get_db)
):
    """Updates a discount rule."""
    discount = db.query(Discount).filter(Discount.id == id).first()
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with ID {id} not found."
        )

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(discount, field, val)

    db.commit()
    db.refresh(discount)
    return discount

@router.patch("/{id}/toggle", response_model=DiscountResponse)
def toggle_discount_active(id: int, db: Session = Depends(get_db)):
    """Toggles active/inactive status of a discount rule."""
    discount = db.query(Discount).filter(Discount.id == id).first()
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with ID {id} not found."
        )

    discount.is_active = not discount.is_active
    db.commit()
    db.refresh(discount)
    return discount

@router.post("/validate", response_model=DiscountValidateResponse)
def validate_discount(
    payload: DiscountValidateRequest,
    db: Session = Depends(get_db)
):
    """Tests if a discount code applies to a prospective order/invoice."""
    code_clean = payload.code.strip().upper()
    discount = db.query(Discount).filter(Discount.code == code_clean).first()
    if not discount:
        return DiscountValidateResponse(
            valid=False,
            message=f"Discount code '{code_clean}' not found."
        )

    eligible, msg = DiscountService.is_discount_eligible(
        discount=discount,
        subtotal=payload.subtotal,
        quantity=payload.quantity,
        plan_id=payload.plan_id,
        product_id=payload.product_id
    )

    if not eligible:
        return DiscountValidateResponse(valid=False, message=msg)

    amount = DiscountService.calculate_discount_amount(discount, payload.subtotal)
    return DiscountValidateResponse(
        valid=True,
        message="Discount eligible!",
        discount_amount=amount,
        discount=DiscountResponse.model_validate(discount)
    )
