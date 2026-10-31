from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


# Discount Schemas
class DiscountBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    discount_type: str = Field(..., description="percentage or fixed")
    value: Decimal = Field(..., ge=0)
    min_purchase_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    min_quantity: int = Field(default=0, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    applicable_product_id: Optional[int] = None
    is_active: bool = True


class DiscountCreate(DiscountBase):
    pass


class DiscountResponse(DiscountBase):
    id: int
    times_used: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Invoice Schemas
class InvoiceItemResponse(BaseModel):
    id: int
    invoice_id: int
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    description: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    subscription_id: Optional[int] = None
    billing_period_start: datetime
    billing_period_end: datetime
    subtotal: Decimal
    discount_amount: Decimal
    discount_id: Optional[int] = None
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    issue_date: datetime
    due_date: datetime
    status: str  # draft, confirmed, paid, cancelled
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentCreate(BaseModel):
    invoice_id: int
    payment_method: str = Field("bank_transfer", description="bank_transfer, credit_card, cash, upi, other")
    amount: Decimal = Field(..., gt=0)
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    payment_method: str
    amount: Decimal
    payment_date: datetime
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Billing Generation
class BillingGenerateDueRequest(BaseModel):
    reference_date: Optional[datetime] = None


class BillingGenerateDueResponse(BaseModel):
    generated_count: int
    invoice_ids: List[int]
    skipped_count: int
    message: str


# Dashboard Responses
class RevenueChartPoint(BaseModel):
    month: str
    revenue: Decimal


class DashboardSummaryResponse(BaseModel):
    active_subscriptions: int
    total_revenue: Decimal
    outstanding_amount: Decimal
    overdue_invoices_count: int
    total_customers: int
    recent_invoices: List[InvoiceResponse] = []
