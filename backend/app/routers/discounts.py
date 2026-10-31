from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin
from app.models.discount import Discount
from app.models.user import User
from app.schemas.finance import DiscountCreate, DiscountResponse

router = APIRouter(prefix="/discounts", tags=["Discounts"])


@router.get("", response_model=List[DiscountResponse])
def list_discounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Discount).order_by(Discount.created_at.desc()).all()


@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(payload: DiscountCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    code = payload.code.strip().upper()
    if db.query(Discount).filter(Discount.code == code).first():
        raise HTTPException(status_code=409, detail="Discount code already exists")
    data = payload.model_dump(exclude={"discount_value", "max_uses"})
    discount = Discount(
        code=code, name=payload.name, description=payload.description,
        discount_type=payload.discount_type, value=payload.value,
        min_purchase_amount=payload.min_purchase_amount, min_quantity=payload.min_quantity,
        start_date=payload.start_date, end_date=payload.end_date,
        usage_limit=payload.usage_limit, applicable_product_id=payload.applicable_product_id,
        applicable_plan_id=payload.applicable_plan_id, is_active=payload.is_active,
    )
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount
