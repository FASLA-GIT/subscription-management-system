from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False, index=True)
    
    # Lifecycle: draft -> quotation -> confirmed -> active -> closed
    status = Column(String(50), default="draft", nullable=False)
    
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    payment_terms = Column(String(100), default="Immediate", nullable=False)
    next_billing_date = Column(DateTime, nullable=True)
    
    total_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    tax_rate = Column(Numeric(5, 2, asdecimal=True), nullable=False, default=Decimal("18.00"))
    tax_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    is_paused = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    items = relationship("SubscriptionItem", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription")

    def __repr__(self):
        return f"<Subscription id={self.id} number={self.subscription_number} status={self.status}>"


class SubscriptionItem(Base):
    __tablename__ = "subscription_items"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("variants.id"), nullable=True, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    total_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))

    # Relationships
    subscription = relationship("Subscription", back_populates="items")
    product = relationship("Product", back_populates="subscription_items")
    variant = relationship("Variant", back_populates="subscription_items")

    def __repr__(self):
        return f"<SubscriptionItem id={self.id} sub_id={self.subscription_id} product_id={self.product_id} qty={self.quantity}>"
