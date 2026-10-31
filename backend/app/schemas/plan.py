from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


VALID_FREQUENCIES = {"daily", "weekly", "monthly", "yearly"}


class PlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Plan name, e.g. Monthly Standard")
    price: float = Field(0.0, ge=0.0, description="Base recurring plan fee")
    billing_frequency: str = Field("monthly", description="Billing frequency: daily, weekly, monthly, yearly")
    minimum_quantity: int = Field(1, ge=1, description="Minimum quantity required")
    availability_start_date: date = Field(default_factory=date.today)
    availability_end_date: Optional[date] = None

    auto_close: bool = Field(False, description="Automatically close when plan ends")
    allow_early_closure: bool = Field(True, description="Allow early subscription closure")
    allow_pause: bool = Field(True, description="Allow customer/admin to pause subscription")
    allow_renewal: bool = Field(True, description="Allow renewal when subscription period ends")
    is_active: bool = Field(True, description="Whether plan is actively available")

    @field_validator("billing_frequency")
    @classmethod
    def validate_frequency(cls, v: str) -> str:
        val = v.strip().lower()
        if val not in VALID_FREQUENCIES:
            raise ValueError(f"Invalid billing frequency '{v}'. Must be one of: {', '.join(sorted(VALID_FREQUENCIES))}")
        return val


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[float] = Field(None, ge=0.0)
    billing_frequency: Optional[str] = None
    minimum_quantity: Optional[int] = Field(None, ge=1)
    availability_start_date: Optional[date] = None
    availability_end_date: Optional[date] = None
    auto_close: Optional[bool] = None
    allow_early_closure: Optional[bool] = None
    allow_pause: Optional[bool] = None
    allow_renewal: Optional[bool] = None
    is_active: Optional[bool] = None

    @field_validator("billing_frequency")
    @classmethod
    def validate_frequency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            val = v.strip().lower()
            if val not in VALID_FREQUENCIES:
                raise ValueError(f"Invalid billing frequency '{v}'. Must be one of: {', '.join(sorted(VALID_FREQUENCIES))}")
            return val
        return v


class PlanResponse(PlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
