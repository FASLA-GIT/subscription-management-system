from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, AliasChoices, computed_field, ConfigDict


# Discount Schemas
class DiscountBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    code: str = Field(..., min_length=1, max_length=100)
    name: Optional[str] = None
    description: Optional[str] = None
    discount_type: str = Field(..., description="percentage or fixed")
    value: Decimal = Field(
        ...,
        ge=0,
        validation_alias=AliasChoices("value", "discount_value")
    )
    min_purchase_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    min_quantity: int = Field(default=0, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = Field(
        None,
        validation_alias=AliasChoices("usage_limit", "max_uses")
    )
    applicable_product_id: Optional[int] = None
    applicable_plan_id: Optional[int] = None
    is_active: bool = True

    @computed_field
    @property
    def discount_value(self) -> Decimal:
        return self.value

    @computed_field
    @property
    def max_uses(self) -> Optional[int]:
        return self.usage_limit


class DiscountCreate(DiscountBase):
    pass


class DiscountResponse(DiscountBase):
    id: int
    times_used: int = Field(
        default=0,
        validation_alias=AliasChoices("times_used", "used_count")
    )
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def used_count(self) -> int:
        return self.times_used


# Invoice Schemas
class InvoiceItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    invoice_id: int
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    description: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal = Field(
        ...,
        validation_alias=AliasChoices("total_price", "amount")
    )
    product_name: Optional[str] = None
    variant_name: Optional[str] = None

    @computed_field
    @property
    def amount(self) -> Decimal:
        return self.total_price


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    invoice_number: str
    customer_id: int
    subscription_id: Optional[int] = None
    billing_period_start: datetime
    billing_period_end: datetime
    subtotal: Decimal
    discount_amount: Decimal = Decimal("0.00")
    discount_id: Optional[int] = None
    tax_rate: Decimal = Decimal("18.00")
    tax_amount: Decimal = Decimal("0.00")
    total_amount: Decimal = Field(
        ...,
        validation_alias=AliasChoices("total_amount", "final_amount")
    )
    amount_paid: Decimal = Field(
        default=Decimal("0.00"),
        validation_alias=AliasChoices("amount_paid", "paid_amount")
    )
    balance_due: Decimal = Field(
        default=Decimal("0.00"),
        validation_alias=AliasChoices("balance_due", "outstanding_amount")
    )
    issue_date: datetime
    due_date: datetime
    status: str  # draft, confirmed, paid, overdue, cancelled
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    customer_name: Optional[str] = None
    subscription_number: Optional[str] = None
    items: List[InvoiceItemResponse] = []

    @computed_field
    @property
    def final_amount(self) -> Decimal:
        return self.total_amount

    @computed_field
    @property
    def paid_amount(self) -> Decimal:
        return self.amount_paid

    @computed_field
    @property
    def outstanding_amount(self) -> Decimal:
        return self.balance_due


class InvoiceStatusUpdate(BaseModel):
    status: str = Field(..., description="draft, confirmed, paid, overdue, cancelled")


# Payment Schemas
class PaymentCreate(BaseModel):
    invoice_id: int
    payment_method: str = Field("bank_transfer", description="bank_transfer, credit_card, cash, upi, other")
    amount: Decimal = Field(..., gt=0)
    payment_date: Optional[datetime] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("notes", "note")
    )


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    invoice_id: int
    payment_method: str
    amount: Decimal
    payment_date: datetime
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    invoice_number: Optional[str] = None
    customer_name: Optional[str] = None

    @computed_field
    @property
    def note(self) -> Optional[str]:
        return self.notes


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
    invoices: Optional[int] = 0


class DashboardSummaryResponse(BaseModel):
    active_subscriptions: int
    total_revenue: Decimal
    outstanding_amount: Decimal
    overdue_invoices_count: int = Field(
        default=0,
        validation_alias=AliasChoices("overdue_invoices_count", "overdue_invoices")
    )
    total_customers: int
    total_invoices: Optional[int] = 0
    recent_invoices: List[InvoiceResponse] = []

    @computed_field
    @property
    def overdue_invoices(self) -> int:
        return self.overdue_invoices_count
