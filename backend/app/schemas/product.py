from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, AliasChoices, computed_field, ConfigDict


class VariantBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    variant_name: str = Field(
        ...,
        validation_alias=AliasChoices("variant_name", "name"),
        min_length=1,
        max_length=255
    )
    additional_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    sku: Optional[str] = None
    is_active: bool = True

    @computed_field
    @property
    def name(self) -> str:
        return self.variant_name


class VariantCreate(VariantBase):
    pass


class VariantResponse(VariantBase):
    id: int
    product_id: int
    created_at: datetime


class ProductBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=255)
    product_type: str = Field(
        "Software",
        validation_alias=AliasChoices("product_type", "type"),
        description="Software, Service, Add-on, etc."
    )
    sales_price: Decimal = Field(..., ge=0)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    description: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("description", "notes")
    )
    is_active: bool = True

    @computed_field
    @property
    def type(self) -> str:
        return self.product_type

    @computed_field
    @property
    def notes(self) -> Optional[str]:
        return self.description


class ProductCreate(ProductBase):
    variants: Optional[List[VariantCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    product_type: Optional[str] = None
    sales_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    variants: List[VariantResponse] = []
