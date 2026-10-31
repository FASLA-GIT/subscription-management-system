from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.discount import Discount
from app.models.invoice import Invoice, InvoiceItem
from app.models.payment import Payment
from app.models.plan import Plan
from app.models.product import Product, Variant
from app.models.subscription import Subscription, SubscriptionItem
from app.models.user import User
from app.security import hash_password


def seed_database(db: Session):
    """Seed initial sample data if the database is currently empty."""
    # Check if admin user already exists
    if db.query(User).filter(User.email == "admin@brightloop.com").first():
        return

    print("--- Seeding initial demo data for Brightloop Subscription Management ---")

    # 1. Users
    admin_user = User(
        email="admin@brightloop.com",
        hashed_password=hash_password("Admin@Brightloop123!"),
        role="admin",
        is_active=True,
    )
    staff_user = User(
        email="staff@brightloop.com",
        hashed_password=hash_password("Staff@Brightloop123!"),
        role="staff",
        is_active=True,
    )
    customer_user = User(
        email="customer@acme.com",
        hashed_password=hash_password("Customer@Brightloop123!"),
        role="customer",
        is_active=True,
    )
    db.add_all([admin_user, staff_user, customer_user])
    db.flush()

    # 2. Customers
    acme_customer = Customer(
        user_id=customer_user.id,
        name="John Doe",
        company_name="Acme Corporation",
        email="customer@acme.com",
        phone="+91 98765 43210",
        address_line1="104 MG Road",
        city="Bengaluru",
        state="Karnataka",
        postal_code="560001",
        country="India",
        tax_id="29ABCDE1234F1Z5",
        notes="High priority enterprise client",
    )
    db.add(acme_customer)
    db.flush()

    # 3. Products & Variants
    p1 = Product(
        name="Business Software",
        product_type="Software",
        sales_price=Decimal("2000.00"),
        cost_price=Decimal("800.00"),
        description="Comprehensive enterprise resource management software suite.",
        is_active=True,
    )
    p2 = Product(
        name="Cloud Storage Add-on",
        product_type="Add-on",
        sales_price=Decimal("500.00"),
        cost_price=Decimal("150.00"),
        description="100GB secure cloud storage backup extension.",
        is_active=True,
    )
    db.add_all([p1, p2])
    db.flush()

    v1 = Variant(
        product_id=p1.id,
        variant_name="Odoo",
        additional_price=Decimal("560.00"),
        sku="SW-BS-ODOO",
        is_active=True,
    )
    v2 = Variant(
        product_id=p1.id,
        variant_name="Enterprise Plus",
        additional_price=Decimal("1200.00"),
        sku="SW-BS-ENT",
        is_active=True,
    )
    db.add_all([v1, v2])
    db.flush()

    # 4. Subscription Plans
    plan_monthly = Plan(
        name="Pro Monthly",
        price=Decimal("2560.00"),
        billing_frequency="monthly",
        minimum_quantity=1,
        auto_close=False,
        early_close=True,
        pause_allowed=True,
        renewal_allowed=True,
        description="Standard monthly recurring billing plan.",
        is_active=True,
    )
    plan_yearly = Plan(
        name="Enterprise Yearly",
        price=Decimal("25000.00"),
        billing_frequency="yearly",
        minimum_quantity=1,
        auto_close=False,
        early_close=True,
        pause_allowed=True,
        renewal_allowed=True,
        description="Annual subscription with 2 months free savings.",
        is_active=True,
    )
    db.add_all([plan_monthly, plan_yearly])
    db.flush()

    # 5. Discounts
    discount_welcome = Discount(
        code="WELCOME10",
        description="10% discount for new onboarding clients",
        discount_type="percentage",
        value=Decimal("10.00"),
        min_purchase_amount=Decimal("1000.00"),
        is_active=True,
    )
    discount_flat = Discount(
        code="FLAT500",
        description="₹500 flat discount on orders over ₹2000",
        discount_type="fixed",
        value=Decimal("500.00"),
        min_purchase_amount=Decimal("2000.00"),
        is_active=True,
    )
    db.add_all([discount_welcome, discount_flat])
    db.flush()

    # 6. Sample Active Subscription
    start_dt = datetime.utcnow() - timedelta(days=35)
    next_bill_dt = datetime.utcnow() - timedelta(days=5)  # due for automatic invoice generation demo!

    sub = Subscription(
        subscription_number="SUB-2026-0001",
        customer_id=acme_customer.id,
        plan_id=plan_monthly.id,
        status="active",
        start_date=start_dt,
        payment_terms="Immediate",
        next_billing_date=next_bill_dt,
        total_amount=Decimal("3020.80"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("460.80"),
        notes="First enterprise pilot subscription",
    )
    db.add(sub)
    db.flush()

    sub_item = SubscriptionItem(
        subscription_id=sub.id,
        product_id=p1.id,
        variant_id=v1.id,
        quantity=1,
        unit_price=Decimal("2560.00"),
        total_price=Decimal("2560.00"),
    )
    db.add(sub_item)
    db.flush()

    # 7. Sample Initial Invoice & Payment
    inv = Invoice(
        invoice_number="INV-2026-0001",
        customer_id=acme_customer.id,
        subscription_id=sub.id,
        billing_period_start=start_dt,
        billing_period_end=start_dt + timedelta(days=30),
        subtotal=Decimal("2560.00"),
        discount_amount=Decimal("0.00"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("460.80"),
        total_amount=Decimal("3020.80"),
        amount_paid=Decimal("3020.80"),
        balance_due=Decimal("0.00"),
        issue_date=start_dt,
        due_date=start_dt + timedelta(days=15),
        status="paid",
        notes="Paid in full via Bank Transfer",
    )
    db.add(inv)
    db.flush()

    inv_item = InvoiceItem(
        invoice_id=inv.id,
        product_id=p1.id,
        variant_id=v1.id,
        description="Business Software (Odoo)",
        quantity=1,
        unit_price=Decimal("2560.00"),
        total_price=Decimal("2560.00"),
    )
    db.add(inv_item)
    db.flush()

    payment = Payment(
        invoice_id=inv.id,
        payment_method="bank_transfer",
        amount=Decimal("3020.80"),
        payment_date=start_dt + timedelta(days=2),
        reference_number="TXN-BL-982341",
        notes="Bank NEFT settlement confirmed",
    )
    db.add(payment)

    db.commit()
    print("--- Demo data seeded successfully! ---")
