from datetime import date, timedelta
from decimal import Decimal
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.finance import Invoice, Payment, InvoiceStatus, PaymentMethod
from app.services.dashboard_service import DashboardService

def test_dashboard_summary_calculations(db_session, sample_customer, sample_plan):
    today = date.today()

    # 1. Create 2 Active subscriptions and 1 Draft
    sub1 = Subscription(
        subscription_number="SUB-DASH-1",
        customer_id=sample_customer.id,
        plan_id=sample_plan.id,
        status=SubscriptionStatus.ACTIVE,
        start_date=today
    )
    sub2 = Subscription(
        subscription_number="SUB-DASH-2",
        customer_id=sample_customer.id,
        plan_id=sample_plan.id,
        status=SubscriptionStatus.ACTIVE,
        start_date=today
    )
    sub3 = Subscription(
        subscription_number="SUB-DASH-3",
        customer_id=sample_customer.id,
        plan_id=sample_plan.id,
        status=SubscriptionStatus.DRAFT,
        start_date=today
    )
    db_session.add_all([sub1, sub2, sub3])
    db_session.commit()

    # 2. Invoices: 1 Paid (2000), 1 Partially Paid (1500 total, 500 paid, 1000 outstanding), 1 Overdue (3000 total, due 10 days ago)
    inv_paid = Invoice(
        invoice_number="INV-D-1",
        customer_id=sample_customer.id,
        subscription_id=sub1.id,
        billing_period_start=today,
        billing_period_end=today,
        issue_date=today,
        due_date=today,
        subtotal=Decimal("2000.00"),
        total_amount=Decimal("2000.00"),
        amount_paid=Decimal("2000.00"),
        outstanding_amount=Decimal("0.00"),
        status=InvoiceStatus.PAID
    )
    inv_partial = Invoice(
        invoice_number="INV-D-2",
        customer_id=sample_customer.id,
        subscription_id=sub2.id,
        billing_period_start=today,
        billing_period_end=today,
        issue_date=today,
        due_date=today + timedelta(days=5),
        subtotal=Decimal("1500.00"),
        total_amount=Decimal("1500.00"),
        amount_paid=Decimal("500.00"),
        outstanding_amount=Decimal("1000.00"),
        status=InvoiceStatus.PARTIALLY_PAID
    )
    inv_overdue = Invoice(
        invoice_number="INV-D-3",
        customer_id=sample_customer.id,
        subscription_id=sub1.id,
        billing_period_start=today - timedelta(days=20),
        billing_period_end=today - timedelta(days=10),
        issue_date=today - timedelta(days=20),
        due_date=today - timedelta(days=10),
        subtotal=Decimal("3000.00"),
        total_amount=Decimal("3000.00"),
        amount_paid=Decimal("0.00"),
        outstanding_amount=Decimal("3000.00"),
        status=InvoiceStatus.OVERDUE
    )
    db_session.add_all([inv_paid, inv_partial, inv_overdue])
    db_session.commit()

    # 3. Payments: 2000 on inv_paid, 500 on inv_partial
    p1 = Payment(
        payment_number="PAY-D-1",
        invoice_id=inv_paid.id,
        amount=Decimal("2000.00"),
        payment_method=PaymentMethod.BANK_TRANSFER,
        payment_date=today
    )
    p2 = Payment(
        payment_number="PAY-D-2",
        invoice_id=inv_partial.id,
        amount=Decimal("500.00"),
        payment_method=PaymentMethod.UPI,
        payment_date=today
    )
    db_session.add_all([p1, p2])
    db_session.commit()

    # Verify Summary
    summary = DashboardService.get_summary(db_session)
    assert summary.total_active_subscriptions == 2
    assert summary.total_revenue == Decimal("2500.00")
    # Outstanding = 1000 (inv_partial) + 3000 (inv_overdue) = 4000
    assert summary.total_outstanding == Decimal("4000.00")
    # Overdue = 3000
    assert summary.total_overdue_amount == Decimal("3000.00")
    assert summary.overdue_invoices_count == 1
    assert summary.total_invoices_count == 3

def test_overdue_invoices_service(db_session, sample_customer, sample_plan):
    today = date.today()
    inv_overdue = Invoice(
        invoice_number="INV-AGING-1",
        customer_id=sample_customer.id,
        subscription_id=1,
        billing_period_start=today - timedelta(days=20),
        billing_period_end=today - timedelta(days=10),
        issue_date=today - timedelta(days=20),
        due_date=today - timedelta(days=7),
        subtotal=Decimal("1000.00"),
        total_amount=Decimal("1000.00"),
        amount_paid=Decimal("200.00"),
        outstanding_amount=Decimal("800.00"),
        status=InvoiceStatus.OVERDUE
    )
    db_session.add(inv_overdue)
    db_session.commit()

    res = DashboardService.get_overdue_invoices(db_session)
    assert res.total_overdue_count == 1
    assert res.total_overdue_amount == Decimal("800.00")
    assert res.items[0].days_overdue == 7
    assert res.items[0].customer_name == "Apex Global Ltd"
