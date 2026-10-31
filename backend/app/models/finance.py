import enum
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, ForeignKey,
    Enum, Text, Numeric, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class DiscountType(str, enum.Enum):
    FIXED = "fixed"
    PERCENTAGE = "percentage"

class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "bank_transfer"
    CREDIT_CARD = "credit_card"
    UPI = "upi"
    CASH = "cash"
    OTHER = "other"

class Discount(Base):
    """Discount rules configured by Admin."""
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    discount_type = Column(Enum(DiscountType), default=DiscountType.PERCENTAGE, nullable=False)
    discount_value = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    
    # Eligibility constraints
    min_purchase_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    min_quantity = Column(Integer, default=1, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    max_uses = Column(Integer, nullable=True)  # None = unlimited
    used_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Optional scopes
    applicable_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    applicable_plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    invoices = relationship("Invoice", back_populates="discount")

class Invoice(Base):
    """Billing invoice generated for a subscription cycle."""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False, index=True)
    
    # Billing cycle
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    issue_date = Column(Date, default=date.today, nullable=False)
    due_date = Column(Date, nullable=False, index=True)

    # Financial Totals (Decimal precision, strictly no floating-point)
    subtotal = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    discount_id = Column(Integer, ForeignKey("discounts.id"), nullable=True)
    discount_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    taxable_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    tax_rate = Column(Numeric(5, 2, asdecimal=True), nullable=False, default=Decimal("18.00"))
    tax_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    
    amount_paid = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    outstanding_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.CONFIRMED, nullable=False, index=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    subscription = relationship("Subscription", back_populates="invoices")
    discount = relationship("Discount", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    # Composite index for rapid lookup and duplicate check
    __table_args__ = (
        Index("idx_invoice_sub_period", "subscription_id", "billing_period_start", "billing_period_end"),
    )

class InvoiceItem(Base):
    """Detailed line items breakdown on an invoice."""
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(255), nullable=False)
    variant_name = Column(String(255), nullable=True)
    
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    line_total = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))

    # Relationships
    invoice = relationship("Invoice", back_populates="items")

class Payment(Base):
    """Payment recorded against an invoice."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(100), unique=True, index=True, nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    
    amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.BANK_TRANSFER, nullable=False)
    payment_date = Column(Date, default=date.today, nullable=False, index=True)
    transaction_reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
