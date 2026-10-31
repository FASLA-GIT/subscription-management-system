from datetime import date
from decimal import Decimal
import pytest
from fastapi import HTTPException

from app.models.finance import Invoice, InvoiceStatus, PaymentMethod
from app.services.payment_service import PaymentService

def test_full_payment_settlement(db_session, sample_customer, sample_plan):
    today = date.today()
    invoice = Invoice(
        invoice_number="INV-PAY-0001",
        customer_id=sample_customer.id,
        subscription_id=1,
        billing_period_start=today,
        billing_period_end=today,
        issue_date=today,
        due_date=today,
        subtotal=Decimal("2000.00"),
        discount_amount=Decimal("0.00"),
        taxable_amount=Decimal("2000.00"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("360.00"),
        total_amount=Decimal("2360.00"),
        amount_paid=Decimal("0.00"),
        outstanding_amount=Decimal("2360.00"),
        status=InvoiceStatus.CONFIRMED
    )
    db_session.add(invoice)
    db_session.commit()

    payment = PaymentService.record_payment(
        db=db_session,
        invoice_id=invoice.id,
        amount=Decimal("2360.00"),
        payment_method=PaymentMethod.BANK_TRANSFER,
        transaction_reference="TXN-FULL-101"
    )

    assert payment.id is not None
    assert invoice.amount_paid == Decimal("2360.00")
    assert invoice.outstanding_amount == Decimal("0.00")
    assert invoice.status == InvoiceStatus.PAID

def test_partial_payment_and_subsequent_settlement(db_session, sample_customer):
    today = date.today()
    invoice = Invoice(
        invoice_number="INV-PAY-0002",
        customer_id=sample_customer.id,
        subscription_id=1,
        billing_period_start=today,
        billing_period_end=today,
        issue_date=today,
        due_date=today,
        subtotal=Decimal("1000.00"),
        discount_amount=Decimal("0.00"),
        taxable_amount=Decimal("1000.00"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("180.00"),
        total_amount=Decimal("1180.00"),
        amount_paid=Decimal("0.00"),
        outstanding_amount=Decimal("1180.00"),
        status=InvoiceStatus.CONFIRMED
    )
    db_session.add(invoice)
    db_session.commit()

    # 1. First partial payment of 500
    pay1 = PaymentService.record_payment(
        db=db_session,
        invoice_id=invoice.id,
        amount=Decimal("500.00"),
        payment_method=PaymentMethod.UPI
    )
    assert invoice.amount_paid == Decimal("500.00")
    assert invoice.outstanding_amount == Decimal("680.00")
    assert invoice.status == InvoiceStatus.PARTIALLY_PAID

    # 2. Second payment of remaining 680
    pay2 = PaymentService.record_payment(
        db=db_session,
        invoice_id=invoice.id,
        amount=Decimal("680.00"),
        payment_method=PaymentMethod.CREDIT_CARD
    )
    assert invoice.amount_paid == Decimal("1180.00")
    assert invoice.outstanding_amount == Decimal("0.00")
    assert invoice.status == InvoiceStatus.PAID

def test_excess_payment_rejection(db_session, sample_customer):
    today = date.today()
    invoice = Invoice(
        invoice_number="INV-PAY-0003",
        customer_id=sample_customer.id,
        subscription_id=1,
        billing_period_start=today,
        billing_period_end=today,
        issue_date=today,
        due_date=today,
        subtotal=Decimal("1000.00"),
        discount_amount=Decimal("0.00"),
        taxable_amount=Decimal("1000.00"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("180.00"),
        total_amount=Decimal("1180.00"),
        amount_paid=Decimal("0.00"),
        outstanding_amount=Decimal("1180.00"),
        status=InvoiceStatus.CONFIRMED
    )
    db_session.add(invoice)
    db_session.commit()

    # Attempt to pay 1500 when outstanding is only 1180
    with pytest.raises(HTTPException) as exc_info:
        PaymentService.record_payment(
            db=db_session,
            invoice_id=invoice.id,
            amount=Decimal("1500.00")
        )
    assert exc_info.value.status_code == 400
    assert "exceeds current outstanding balance" in exc_info.value.detail

def test_negative_or_zero_payment_rejection(db_session, sample_customer):
    today = date.today()
    invoice = Invoice(
        invoice_number="INV-PAY-0004",
        customer_id=sample_customer.id,
        subscription_id=1,
        billing_period_start=today,
        billing_period_end=today,
        issue_date=today,
        due_date=today,
        subtotal=Decimal("1000.00"),
        total_amount=Decimal("1000.00"),
        outstanding_amount=Decimal("1000.00"),
        status=InvoiceStatus.CONFIRMED
    )
    db_session.add(invoice)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        PaymentService.record_payment(db=db_session, invoice_id=invoice.id, amount=Decimal("0.00"))
    assert exc.value.status_code == 400
