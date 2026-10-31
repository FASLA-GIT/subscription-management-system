from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class SubscriptionItemBase(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: Optional[Decimal] = None


class SubscriptionItemCreate(SubscriptionItemBase):
    pass


class SubscriptionItemResponse(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True


class SubscriptionBase(BaseModel):
    customer_id: int
    plan_id: int
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    payment_terms: str = "Immediate"
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0)
    notes: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    items: List[SubscriptionItemCreate]


class SubscriptionStatusUpdate(BaseModel):
    # Lifecycle: draft -> quotation -> confirmed -> active -> closed
    status: str = Field(..., description="draft, quotation, confirmed, active, closed")


class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    expiry_date: Optional[datetime] = None
    payment_terms: Optional[str] = None
    is_paused: Optional[bool] = None
    notes: Optional[str] = None


class SubscriptionResponse(SubscriptionBase):
    id: int
    subscription_number: str
    status: str
    start_date: datetime
    next_billing_date: Optional[datetime] = None
    total_amount: Decimal
    tax_amount: Decimal
    is_paused: bool
    created_at: datetime
    updated_at: datetime
    items: List[SubscriptionItemResponse] = []

    class Config:
        from_attributes = True
