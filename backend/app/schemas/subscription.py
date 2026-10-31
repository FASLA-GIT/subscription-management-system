from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any
from pydantic import BaseModel, Field, AliasChoices, computed_field, ConfigDict


class SubscriptionItemBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: Optional[Decimal] = None


class SubscriptionItemCreate(SubscriptionItemBase):
    pass


class SubscriptionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal = Field(
        ...,
        validation_alias=AliasChoices("total_price", "amount", "subtotal")
    )
    product_name: Optional[str] = None
    variant_name: Optional[str] = None

    @computed_field
    @property
    def amount(self) -> Decimal:
        return self.total_price

    @computed_field
    @property
    def subtotal(self) -> Decimal:
        return self.total_price


class SubscriptionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    customer_id: int
    plan_id: int
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    payment_terms: str = "Immediate"
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0)
    notes: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    items: List[SubscriptionItemCreate]
    status: Optional[str] = "active"
    discount_amount: Optional[Decimal] = Decimal("0.00")


class SubscriptionStatusUpdate(BaseModel):
    # Lifecycle: draft -> quotation -> confirmed -> active -> paused -> closed
    status: str = Field(..., description="draft, quotation, confirmed, active, paused, closed")
    reason: Optional[str] = None


class SubscriptionCloseRequest(BaseModel):
    reason: Optional[str] = None


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
    customer_name: Optional[str] = None
    plan_name: Optional[str] = None
    items: List[SubscriptionItemResponse] = []

    @computed_field
    @property
    def taxes(self) -> Decimal:
        return self.tax_amount

    @computed_field
    @property
    def subtotal(self) -> Decimal:
        return max(Decimal("0.00"), self.total_amount - self.tax_amount)
