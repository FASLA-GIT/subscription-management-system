from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    """
    Products sold by Brightloop Software (e.g. Business Software, CRM, Add-ons).
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    product_type = Column(String(100), default="Software", nullable=False)  # Software, Service, Add-on, License
    sales_price = Column(Float, nullable=False, default=0.0)  # Base selling price in INR
    cost_price = Column(Float, default=0.0)  # Cost price for margin calculations
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    subscription_items = relationship("SubscriptionItem", back_populates="product")


class ProductVariant(Base):
    """
    Product variants with additional pricing (e.g. Odoo edition +560, Enterprise +1200).
    Final unit price = product.sales_price + variant.additional_price
    """
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    additional_price = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="variants")
