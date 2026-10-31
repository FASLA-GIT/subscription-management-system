from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    product_type = Column(String(100), default="Software", nullable=False)  # Software, Service, Add-on
    sales_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    cost_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    variants = relationship("Variant", back_populates="product", cascade="all, delete-orphan")
    subscription_items = relationship("SubscriptionItem", back_populates="product")
    invoice_items = relationship("InvoiceItem", back_populates="product")

    def __repr__(self):
        return f"<Product id={self.id} name={self.name} sales_price={self.sales_price}>"


class Variant(Base):
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    variant_name = Column(String(255), nullable=False)  # e.g., Odoo, Enterprise, Basic
    additional_price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    sku = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="variants")
    subscription_items = relationship("SubscriptionItem", back_populates="variant")
    invoice_items = relationship("InvoiceItem", back_populates="variant")

    @property
    def name(self):
        return self.variant_name

    @name.setter
    def name(self, val):
        self.variant_name = val

    def __repr__(self):
        return f"<Variant id={self.id} product_id={self.product_id} name={self.variant_name} add_price={self.additional_price}>"


# Compatibility alias
ProductVariant = Variant
