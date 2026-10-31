from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class PlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: Decimal = Field(..., ge=0)
    billing_frequency: str = Field(..., description="daily, weekly, monthly, yearly")
    minimum_quantity: int = Field(default=1, ge=1)
    availability_start_date: Optional[datetime] = None
    availability_end_date: Optional[datetime] = None
    auto_close: bool = False
    early_close: bool = False
    pause_allowed: bool = True
    renewal_allowed: bool = True
    description: Optional[str] = None
    is_active: bool = True


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    billing_frequency: Optional[str] = None
    minimum_quantity: Optional[int] = None
    availability_start_date: Optional[datetime] = None
    availability_end_date: Optional[datetime] = None
    auto_close: Optional[bool] = None
    early_close: Optional[bool] = None
    pause_allowed: Optional[bool] = None
    renewal_allowed: Optional[bool] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PlanResponse(PlanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
