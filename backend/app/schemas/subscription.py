from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.schemas.product import ProductResponse, VariantResponse
from app.schemas.plan import PlanResponse


VALID_STATUSES = {"draft", "quotation", "confirmed", "active", "paused", "closed"}


class SubscriptionItemCreate(BaseModel):
    product_id: int = Field(..., description="ID of product")
    variant_id: Optional[int] = Field(None, description="Optional variant ID")
    quantity: int = Field(1, ge=1, description="Quantity")


class SubscriptionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subscription_id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price: float
    subtotal: float
    product: Optional[ProductResponse] = None
    variant: Optional[VariantResponse] = None


class CustomerBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    company_name: Optional[str] = None


class SubscriptionCreate(BaseModel):
    customer_id: int = Field(..., description="Customer ID")
    plan_id: int = Field(..., description="Plan ID")
    items: List[SubscriptionItemCreate] = Field(..., min_length=1, description="At least one product line item")
    status: str = Field("draft", description="Initial status: draft, quotation, confirmed, active")
    start_date: Optional[date] = Field(default_factory=date.today)
    expiry_date: Optional[date] = None
    payment_terms: str = Field("Immediate", max_length=100)
    tax_percentage: float = Field(18.0, ge=0.0, le=100.0)
    discount_amount: float = Field(0.0, ge=0.0)
    notes: Optional[str] = None
    auto_renew: bool = True

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        val = v.strip().lower()
        if val not in VALID_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Allowed: {', '.join(sorted(VALID_STATUSES))}")
        return val


class SubscriptionUpdate(BaseModel):
    plan_id: Optional[int] = None
    expiry_date: Optional[date] = None
    payment_terms: Optional[str] = None
    tax_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    discount_amount: Optional[float] = Field(None, ge=0.0)
    notes: Optional[str] = None
    auto_renew: Optional[bool] = None


class SubscriptionStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: draft, quotation, confirmed, active, paused, closed")
    reason: Optional[str] = Field(None, description="Reason for status change (required for cancellation/closing)")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        val = v.strip().lower()
        if val not in VALID_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Allowed: {', '.join(sorted(VALID_STATUSES))}")
        return val


class SubscriptionCloseRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Reason for closing the subscription")


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subscription_number: str
    customer_id: int
    plan_id: int
    status: str
    start_date: date
    expiry_date: Optional[date] = None
    next_billing_date: Optional[date] = None
    payment_terms: str
    subtotal: float
    tax_percentage: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    auto_renew: bool
    notes: Optional[str] = None

    pause_date: Optional[date] = None
    resume_date: Optional[date] = None
    closed_date: Optional[date] = None
    close_reason: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    customer: Optional[CustomerBrief] = None
    plan: Optional[PlanResponse] = None
    items: List[SubscriptionItemResponse] = []
