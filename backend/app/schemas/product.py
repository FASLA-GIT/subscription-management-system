from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Product Variant Schemas
class VariantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Variant name, e.g. Odoo edition")
    additional_price: float = Field(0.0, ge=0.0, description="Additional price added to base product price")


class VariantCreate(VariantBase):
    pass


class VariantResponse(VariantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    created_at: datetime


# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    product_type: str = Field("Software", max_length=100, description="Type: Software, Service, Add-on, License")
    sales_price: float = Field(..., ge=0.0, description="Base sales price in INR")
    cost_price: float = Field(0.0, ge=0.0, description="Base cost price in INR")
    description: Optional[str] = Field(None, description="Detailed product description or notes")
    is_active: bool = Field(True, description="Whether product is actively available for purchase")


class ProductCreate(ProductBase):
    variants: Optional[List[VariantCreate]] = Field(None, description="Optional initial variants to create")


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    product_type: Optional[str] = Field(None, max_length=100)
    sales_price: Optional[float] = Field(None, ge=0.0)
    cost_price: Optional[float] = Field(None, ge=0.0)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    variants: List[VariantResponse] = []
