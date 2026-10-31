from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
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
    applicable_plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    invoices = relationship("Invoice", back_populates="discount")

    @property
    def discount_value(self):
        return self.value

    @discount_value.setter
    def discount_value(self, val):
        self.value = val

    @property
    def max_uses(self):
        return self.usage_limit

    @max_uses.setter
    def max_uses(self, val):
        self.usage_limit = val

    @property
    def used_count(self):
        return self.times_used

    @used_count.setter
    def used_count(self, val):
        self.times_used = val

    def __repr__(self):
        return f"<Discount id={self.id} code={self.code} type={self.discount_type} value={self.value}>"
