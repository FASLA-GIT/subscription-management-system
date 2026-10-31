from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.finance import DiscountType, InvoiceStatus, PaymentMethod

# ==========================================
# Discount Schemas
# ==========================================
class DiscountBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, description="Unique discount code e.g. SAVE10")
    name: str = Field(..., min_length=2, max_length=255, description="Discount name e.g. 10% Festive Offer")
    discount_type: DiscountType = Field(default=DiscountType.PERCENTAGE)
    discount_value: Decimal = Field(..., gt=Decimal("0.00"), description="Fixed amount or percentage value")
    min_purchase_amount: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    min_quantity: int = Field(default=1, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_uses: Optional[int] = Field(default=None, ge=1)
    is_active: bool = True
    applicable_product_id: Optional[int] = None
    applicable_plan_id: Optional[int] = None

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.strip().upper()

class DiscountCreate(DiscountBase):
    pass

class DiscountUpdate(BaseModel):
    name: Optional[str] = None
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[Decimal] = None
    min_purchase_amount: Optional[Decimal] = None
    min_quantity: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_uses: Optional[int] = None
    is_active: Optional[bool] = None
    applicable_product_id: Optional[int] = None
    applicable_plan_id: Optional[int] = None

class DiscountResponse(DiscountBase):
    id: int
    used_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# Payment Schemas
# ==========================================
class PaymentCreate(BaseModel):
    invoice_id: int = Field(..., description="Target invoice ID")
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Payment amount must be greater than zero")
    payment_method: PaymentMethod = Field(default=PaymentMethod.BANK_TRANSFER)
    payment_date: Optional[date] = Field(default_factory=date.today)
    transaction_reference: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    payment_number: str
    invoice_id: int
    amount: Decimal
    payment_method: PaymentMethod
    payment_date: date
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# Invoice Item Schemas
# ==========================================
class InvoiceItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    variant_name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True

# ==========================================
# Invoice Schemas
# ==========================================
class CustomerBrief(BaseModel):
    id: int
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    tax_id: Optional[str] = None

    class Config:
        from_attributes = True

class SubscriptionBrief(BaseModel):
    id: int
    subscription_number: str
    plan_name: Optional[str] = None
    status: str

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    subscription_id: int
    billing_period_start: date
    billing_period_end: date
    issue_date: date
    due_date: date
    
    subtotal: Decimal
    discount_id: Optional[int] = None
    discount_amount: Decimal
    taxable_amount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    
    amount_paid: Decimal
    outstanding_amount: Decimal
    status: InvoiceStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    customer: Optional[CustomerBrief] = None

    class Config:
        from_attributes = True

class InvoiceDetailResponse(InvoiceResponse):
    items: List[InvoiceItemResponse] = []
    payments: List[PaymentResponse] = []
    discount: Optional[DiscountResponse] = None

class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus
    notes: Optional[str] = None

# ==========================================
# Automatic Billing Generation Schemas
# ==========================================
class GenerateDueRequest(BaseModel):
    as_of_date: Optional[date] = Field(default_factory=date.today, description="Generate invoices due up to this date")
    apply_best_discount: bool = Field(default=True, description="Automatically evaluate and apply eligible discount")

class SkippedInvoiceInfo(BaseModel):
    subscription_id: int
    subscription_number: str
    reason: str

class GenerateDueResponse(BaseModel):
    generated_count: int
    skipped_count: int
    total_invoiced_amount: Decimal
    generated_invoices: List[InvoiceResponse]
    skipped_subscriptions: List[SkippedInvoiceInfo]

# ==========================================
# Dashboard & Financial Reports Schemas
# ==========================================
class InvoiceStatusCount(BaseModel):
    status: str
    count: int
    total_amount: Decimal

class DashboardSummaryResponse(BaseModel):
    total_active_subscriptions: int
    total_revenue: Decimal
    total_outstanding: Decimal
    total_overdue_amount: Decimal
    overdue_invoices_count: int
    invoices_by_status: List[InvoiceStatusCount]
    total_invoices_count: int

class RevenueTrendPoint(BaseModel):
    date: str  # YYYY-MM or YYYY-MM-DD
    revenue: Decimal
    payment_count: int

class RevenueTrendResponse(BaseModel):
    period: str  # daily or monthly
    total_period_revenue: Decimal
    trends: List[RevenueTrendPoint]

class OverdueInvoiceItem(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    customer_name: str
    customer_email: str
    subscription_number: str
    issue_date: date
    due_date: date
    days_overdue: int
    total_amount: Decimal
    amount_paid: Decimal
    outstanding_amount: Decimal

class OverdueInvoicesResponse(BaseModel):
    total_overdue_count: int
    total_overdue_amount: Decimal
    items: List[OverdueInvoiceItem]
