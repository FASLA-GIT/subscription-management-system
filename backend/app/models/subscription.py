from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Subscription(Base):
    """
    Core Subscription entity tracking customer contracts, billing schedules, and lifecycle.
    Lifecycle states: draft -> quotation -> confirmed -> active -> paused -> closed
    """
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False, index=True)

    # Lifecycle status: draft, quotation, confirmed, active, paused, closed
    status = Column(String(50), default="draft", nullable=False, index=True)

    start_date = Column(Date, default=date.today, nullable=False)
    expiry_date = Column(Date, nullable=True)
    next_billing_date = Column(Date, nullable=True, index=True)
    payment_terms = Column(String(100), default="Immediate", nullable=False)

    # Financial breakdown
    subtotal = Column(Float, default=0.0, nullable=False)
    tax_percentage = Column(Float, default=18.0, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)

    # Policy / renewal flags
    auto_renew = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)

    # Lifecycle tracking dates and reasons
    pause_date = Column(Date, nullable=True)
    resume_date = Column(Date, nullable=True)
    closed_date = Column(Date, nullable=True)
    close_reason = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    items = relationship("SubscriptionItem", back_populates="subscription", cascade="all, delete-orphan")


class SubscriptionItem(Base):
    """
    Line items within a subscription capturing products, selected variants,
    quantity, and locked unit price snapshot.
    """
    __tablename__ = "subscription_items"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("variants.id", ondelete="SET NULL"), nullable=True)

    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)  # Snapshot of unit price at subscription creation
    subtotal = Column(Float, nullable=False)    # quantity * unit_price

    # Relationships
    subscription = relationship("Subscription", back_populates="items")
    product = relationship("Product", back_populates="subscription_items")
    variant = relationship("ProductVariant")
