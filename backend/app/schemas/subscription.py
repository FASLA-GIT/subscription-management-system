from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.subscription import BillingFrequency, SubscriptionStatus

# Product schemas
class ProductBase(BaseModel):
    name: str
    product_type: str = "software"
    sales_price: Decimal
    cost_price: Decimal = Decimal("0.00")
    description: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Variant schemas
class VariantBase(BaseModel):
    product_id: int
    variant_name: str
    additional_price: Decimal = Decimal("0.00")

class VariantCreate(VariantBase):
    pass

class VariantResponse(VariantBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Plan schemas
class PlanBase(BaseModel):
    name: str
    price: Decimal
    billing_frequency: BillingFrequency = BillingFrequency.MONTHLY
    minimum_quantity: int = 1
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    auto_close: bool = False
    early_close: bool = True
    pause_enabled: bool = True
    renewal_enabled: bool = True
    is_active: bool = True

class PlanCreate(PlanBase):
    pass

class PlanResponse(PlanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Subscription Item schemas
class SubscriptionItemBase(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = 1
    unit_price: Decimal
    additional_price: Decimal = Decimal("0.00")

class SubscriptionItemCreate(SubscriptionItemBase):
    pass

class SubscriptionItemResponse(SubscriptionItemBase):
    id: int
    line_total: Decimal

    class Config:
        from_attributes = True

# Subscription schemas
class SubscriptionBase(BaseModel):
    customer_id: int
    plan_id: int
    start_date: Optional[date] = Field(default_factory=date.today)
    expiry_date: Optional[date] = None
    payment_terms: str = "Due on receipt"
    auto_renew: bool = True
    notes: Optional[str] = None

class SubscriptionCreate(SubscriptionBase):
    items: List[SubscriptionItemCreate] = []

class SubscriptionResponse(SubscriptionBase):
    id: int
    subscription_number: str
    status: SubscriptionStatus
    next_billing_date: Optional[date] = None
    quantity: int
    unit_price: Decimal
    tax_rate: Decimal
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
