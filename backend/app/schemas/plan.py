from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, AliasChoices, computed_field, ConfigDict


class PlanBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=255)
    price: Decimal = Field(..., ge=0)
    billing_frequency: str = Field(..., description="daily, weekly, monthly, yearly")
    minimum_quantity: int = Field(
        default=1,
        ge=1,
        validation_alias=AliasChoices("minimum_quantity", "min_quantity")
    )
    availability_start_date: Optional[datetime] = Field(
        default=None,
        validation_alias=AliasChoices("availability_start_date", "start_date")
    )
    availability_end_date: Optional[datetime] = Field(
        default=None,
        validation_alias=AliasChoices("availability_end_date", "end_date")
    )
    auto_close: bool = Field(
        default=False,
        validation_alias=AliasChoices("auto_close", "auto_closure")
    )
    early_close: bool = Field(
        default=False,
        validation_alias=AliasChoices("early_close", "early_closure_allowed")
    )
    pause_allowed: bool = Field(default=True, validation_alias=AliasChoices("pause_allowed", "allow_pause"))
    renewal_allowed: bool = Field(default=True, validation_alias=AliasChoices("renewal_allowed", "allow_renewal"))
    description: Optional[str] = None
    is_active: bool = True

    @computed_field
    @property
    def min_quantity(self) -> int:
        return self.minimum_quantity

    @computed_field
    @property
    def auto_closure(self) -> bool:
        return self.auto_close

    @computed_field
    @property
    def early_closure_allowed(self) -> bool:
        return self.early_close

    @computed_field
    @property
    def allow_pause(self) -> bool:
        return self.pause_allowed

    @computed_field
    @property
    def allow_renewal(self) -> bool:
        return self.renewal_allowed


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
