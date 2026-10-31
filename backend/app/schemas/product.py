from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class VariantBase(BaseModel):
    variant_name: str = Field(..., min_length=1, max_length=255)
    additional_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    sku: Optional[str] = None
    is_active: bool = True


class VariantCreate(VariantBase):
    pass


class VariantResponse(VariantBase):
    id: int
    product_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    product_type: str = Field("Software", description="Software, Service, Add-on, etc.")
    sales_price: Decimal = Field(..., ge=0)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    description: Optional[str] = None
    is_active: bool = True


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

    class Config:
        from_attributes = True
