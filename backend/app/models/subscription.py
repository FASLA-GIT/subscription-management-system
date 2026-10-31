import enum
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class BillingFrequency(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class SubscriptionStatus(str, enum.Enum):
    DRAFT = "draft"
    QUOTATION = "quotation"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"

class Product(Base):
    """Product catalog item."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    product_type = Column(String(100), default="software", nullable=False)  # software, service, add-on
    sales_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    cost_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    variants = relationship("Variant", back_populates="product", cascade="all, delete-orphan")
    subscription_items = relationship("SubscriptionItem", back_populates="product")

class Variant(Base):
    """Product variant with additional price (e.g. Odoo edition, Pro tier)."""
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    variant_name = Column(String(255), nullable=False)
    additional_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="variants")
    subscription_items = relationship("SubscriptionItem", back_populates="variant")

class Plan(Base):
    """Subscription plan defining billing cycle and pricing rules."""
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    billing_frequency = Column(Enum(BillingFrequency), default=BillingFrequency.MONTHLY, nullable=False)
    minimum_quantity = Column(Integer, default=1, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    auto_close = Column(Boolean, default=False, nullable=False)
    early_close = Column(Boolean, default=True, nullable=False)
    pause_enabled = Column(Boolean, default=True, nullable=False)
    renewal_enabled = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(Base):
    """Customer subscription lifecycle record."""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False, index=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.DRAFT, nullable=False, index=True)
    
    start_date = Column(Date, nullable=False, default=date.today)
    expiry_date = Column(Date, nullable=True)
    next_billing_date = Column(Date, nullable=True, index=True)
    payment_terms = Column(String(100), default="Due on receipt", nullable=False)
    
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    tax_rate = Column(Numeric(5, 2, asdecimal=True), default=Decimal("18.00"), nullable=False)
    total_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    auto_renew = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    items = relationship("SubscriptionItem", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription")

class SubscriptionItem(Base):
    """Product lines within a subscription."""
    __tablename__ = "subscription_items"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("variants.id"), nullable=True, index=True)
    
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    additional_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    line_total = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))

    # Relationships
    subscription = relationship("Subscription", back_populates="items")
    product = relationship("Product", back_populates="subscription_items")
    variant = relationship("Variant", back_populates="subscription_items")
