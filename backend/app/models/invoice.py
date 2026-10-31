from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True, index=True)
    
    billing_period_start = Column(DateTime, nullable=False)
    billing_period_end = Column(DateTime, nullable=False)
    
    subtotal = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    discount_id = Column(Integer, ForeignKey("discounts.id"), nullable=True)
    tax_rate = Column(Numeric(5, 2, asdecimal=True), nullable=False, default=Decimal("18.00"))
    tax_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    amount_paid = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    balance_due = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    
    issue_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    
    # Lifecycle: draft -> confirmed -> paid (or cancelled)
    status = Column(String(50), default="draft", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    subscription = relationship("Subscription", back_populates="invoices")
    discount = relationship("Discount", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    __table_args__ = (
        # Prevent duplicate invoices for the same subscription and billing period
        UniqueConstraint("subscription_id", "billing_period_start", "billing_period_end", name="uq_sub_billing_period"),
    )

    def __repr__(self):
        return f"<Invoice id={self.id} number={self.invoice_number} status={self.status} total={self.total_amount}>"


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("variants.id"), nullable=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    total_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))

    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product", back_populates="invoice_items")
    variant = relationship("Variant", back_populates="invoice_items")

    def __repr__(self):
        return f"<InvoiceItem id={self.id} invoice_id={self.invoice_id} desc={self.description} total={self.total_price}>"
