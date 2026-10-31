from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    price = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    billing_frequency = Column(String(50), nullable=False)  # daily, weekly, monthly, yearly
    minimum_quantity = Column(Integer, default=1, nullable=False)
    availability_start_date = Column(DateTime, nullable=True)
    availability_end_date = Column(DateTime, nullable=True)
    auto_close = Column(Boolean, default=False, nullable=False)
    early_close = Column(Boolean, default=False, nullable=False)
    pause_allowed = Column(Boolean, default=True, nullable=False)
    renewal_allowed = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

    def __repr__(self):
        return f"<Plan id={self.id} name={self.name} freq={self.billing_frequency} price={self.price}>"
