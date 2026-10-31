from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    payment_method = Column(String(50), nullable=False)  # bank_transfer, credit_card, cash, upi, other
    amount = Column(Numeric(12, 2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")

    @property
    def invoice_number(self):
        return self.invoice.invoice_number if self.invoice else None

    @property
    def customer_name(self):
        return self.invoice.customer.name if self.invoice and self.invoice.customer else None

    @property
    def note(self):
        return self.notes

    @note.setter
    def note(self, val):
        self.notes = val

    def __repr__(self):
        return f"<Payment id={self.id} invoice_id={self.invoice_id} amount={self.amount} method={self.payment_method}>"
