from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Plan(Base):
    """
    Subscription billing plans with frequencies and lifecycle rules.
    Frequencies supported: daily, weekly, monthly, yearly
    """
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    price = Column(Float, default=0.0, nullable=False)  # Base recurring plan fee (if any)
    billing_frequency = Column(String(50), nullable=False, default="monthly")  # daily, weekly, monthly, yearly
    minimum_quantity = Column(Integer, default=1, nullable=False)
    availability_start_date = Column(Date, default=date.today, nullable=False)
    availability_end_date = Column(Date, nullable=True)

    # Configurable plan options
    auto_close = Column(Boolean, default=False)  # Automatic closure when plan ends
    allow_early_closure = Column(Boolean, default=True)
    allow_pause = Column(Boolean, default=True)
    allow_renewal = Column(Boolean, default=True)

    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")
