from datetime import datetime, timedelta
from decimal import Decimal

from app.models.customer import Customer
from app.models.discount import Discount
from app.models.plan import Plan
from app.models.product import Product, Variant
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate
from app.schemas.finance import BillingGenerateDueRequest, PaymentCreate
from app.routers.subscriptions import create_subscription
from app.routers.billing import generate_due_invoices, get_invoice
from app.routers.payments import record_payment
from app.routers.dashboard import get_dashboard_summary


def test_subscription_invoice_partial_payment_dashboard(db_session):
    customer = Customer(name="Nova Retail Solutions", email="nova.integration@example.test")
    product = Product(name="Business Software", product_type="software", sales_price=Decimal("2000.00"))
    plan = Plan(name="Professional Monthly Integration", price=Decimal("0.00"), billing_frequency="monthly")
    db_session.add_all([customer, product, plan])
    db_session.flush()
    variant = Variant(product_id=product.id, variant_name="Odoo Integration", additional_price=Decimal("560.00"))
    discount = Discount(code="NOVA10", name="Nova 10%", discount_type="percentage", value=Decimal("10.00"),
                        min_purchase_amount=Decimal("0.00"), min_quantity=1,
                        start_date=datetime.utcnow() - timedelta(days=1), is_active=True)
    db_session.add_all([variant, discount])
    db_session.commit()

    admin = db_session.query(User).filter(User.role == "admin").first() or User(id=1, role="admin")
    payload = SubscriptionCreate(customer_id=customer.id, plan_id=plan.id, status="active", start_date=datetime.utcnow() - timedelta(days=32), tax_rate=Decimal("18.00"),
        items=[{"product_id": product.id, "variant_id": variant.id, "quantity": 2}])
    created = create_subscription(payload=payload, db=db_session, current_user=admin)
    generated = generate_due_invoices(payload=BillingGenerateDueRequest(reference_date=datetime.utcnow()), db=db_session, current_user=admin)
    invoice_id = generated.invoice_ids[-1]
    invoice = get_invoice(invoice_id=invoice_id, db=db_session, current_user=admin)
    assert Decimal(str(invoice.subtotal)) == Decimal("5120.00")
    assert Decimal(str(invoice.discount_amount)) == Decimal("512.00")
    assert Decimal(str(invoice.tax_amount)) == Decimal("829.44")
    assert Decimal(str(invoice.total_amount)) == Decimal("5437.44")

    payment_payload = PaymentCreate(invoice_id=invoice_id, payment_method="bank_transfer", amount=Decimal("2000.00"))
    record_payment(payload=payment_payload, db=db_session, current_user=admin)
    updated = db_session.get(type(invoice), invoice_id)
    assert updated.status == "partially_paid"
    assert updated.amount_paid == Decimal("2000.00")
    assert updated.balance_due == Decimal("3437.44")

    dashboard = get_dashboard_summary(db=db_session, current_user=admin)
    assert dashboard.total_revenue >= Decimal("2000.00")
    assert dashboard.outstanding_amount >= Decimal("3437.44")
