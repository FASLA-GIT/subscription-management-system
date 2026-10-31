from datetime import date, timedelta
from decimal import Decimal
from app.models.subscription import Subscription, SubscriptionItem, SubscriptionStatus, BillingFrequency
from app.models.finance import Discount, DiscountType, Invoice, InvoiceStatus
from app.services.billing_service import BillingService

def test_automatic_invoice_generation_and_tax(db_session, sample_customer, sample_plan, sample_product):
    today = date.today()
    # Create active subscription due today
    sub = Subscription(
        subscription_number="SUB-TEST-0001",
        customer_id=sample_customer.id,
        plan_id=sample_plan.id,
        status=SubscriptionStatus.ACTIVE,
        start_date=today,
        next_billing_date=today,
        payment_terms="Net 15",
        tax_rate=Decimal("18.00"),
        quantity=1,
        unit_price=Decimal("2000.00"),
        total_amount=Decimal("2000.00")
    )
    db_session.add(sub)
    db_session.flush()

    item = SubscriptionItem(
        subscription_id=sub.id,
        product_id=sample_product.id,
        quantity=1,
        unit_price=Decimal("2000.00"),
        additional_price=Decimal("0.00"),
        line_total=Decimal("2000.00")
    )
    db_session.add(item)
    db_session.commit()

    # Generate invoice
    invoice, err = BillingService.generate_invoice_for_subscription(db_session, sub, as_of_date=today, auto_discount=False)
    assert err is None
    assert invoice is not None
    assert invoice.customer_id == sample_customer.id
    assert invoice.subtotal == Decimal("2000.00")
    assert invoice.tax_rate == Decimal("18.00")
    # 18% of 2000 = 360.00
    assert invoice.tax_amount == Decimal("360.00")
    assert invoice.total_amount == Decimal("2360.00")
    assert invoice.amount_paid == Decimal("0.00")
    assert invoice.outstanding_amount == Decimal("2360.00")
    assert invoice.status == InvoiceStatus.CONFIRMED

    # Check next billing date was advanced by ~1 month
    assert sub.next_billing_date > today

def test_duplicate_invoice_prevention(db_session, sample_customer, sample_plan, sample_product):
    today = date.today()
    sub = Subscription(
        subscription_number="SUB-DUP-0001",
        customer_id=sample_customer.id,
        plan_id=sample_plan.id,
        status=SubscriptionStatus.ACTIVE,
        start_date=today,
        next_billing_date=today,
        quantity=1,
        unit_price=Decimal("2000.00"),
        total_amount=Decimal("2000.00")
    )
    db_session.add(sub)
    db_session.commit()

    # First generation succeeds
    inv1, err1 = BillingService.generate_invoice_for_subscription(db_session, sub, as_of_date=today)
    assert inv1 is not None
    assert err1 is None

    # Reset next_billing_date back to simulate repeated/accidental run for same period
    sub.next_billing_date = today
    db_session.commit()

    # Second generation for same period must be prevented!
    inv2, err2 = BillingService.generate_invoice_for_subscription(db_session, sub, as_of_date=today)
    assert inv2 is None
    assert "Duplicate prevented" in err2

def test_invoice_generation_with_discount(db_session, sample_customer, sample_plan, sample_product):
    today = date.today()
    # Add active discount
    discount = Discount(
        code="SAVE10",
        name="10% Off",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10.00"),
        min_purchase_amount=Decimal("1000.00"),
        is_active=True
    )
    db_session.add(discount)

    sub = Subscription(
        subscription_number="SUB-DISC-0001",
        customer_id=sample_customer.id,
        plan_id=sample_plan.id,
        status=SubscriptionStatus.ACTIVE,
        start_date=today,
        next_billing_date=today,
        quantity=1,
        unit_price=Decimal("2000.00"),
        tax_rate=Decimal("18.00"),
        total_amount=Decimal("2000.00")
    )
    db_session.add(sub)
    db_session.commit()

    inv, err = BillingService.generate_invoice_for_subscription(
        db_session, sub, as_of_date=today, discount_code="SAVE10"
    )
    assert inv is not None
    assert inv.subtotal == Decimal("2000.00")
    assert inv.discount_amount == Decimal("200.00")  # 10% of 2000
    assert inv.taxable_amount == Decimal("1800.00")  # 2000 - 200
    assert inv.tax_amount == Decimal("324.00")        # 18% of 1800
    assert inv.total_amount == Decimal("2124.00")     # 1800 + 324
    assert inv.outstanding_amount == Decimal("2124.00")
