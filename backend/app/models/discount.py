from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(String(50), nullable=False)  # fixed, percentage
    value = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    min_purchase_amount = Column(Numeric(12, 2, asdecimal=True), default=Decimal("0.00"), nullable=False)
    min_quantity = Column(Integer, default=0, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    usage_limit = Column(Integer, nullable=True)  # Null for unlimited
    times_used = Column(Integer, default=0, nullable=False)
    applicable_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    invoices = relationship("Invoice", back_populates="discount")

    def __repr__(self):
        return f"<Discount id={self.id} code={self.code} type={self.discount_type} value={self.value}>"
