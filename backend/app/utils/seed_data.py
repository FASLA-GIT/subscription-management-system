from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal, Base
from app.models.user import User, Customer, UserRole
from app.models.subscription import (
    Product, Variant, Plan, Subscription, SubscriptionItem,
    BillingFrequency, SubscriptionStatus
)
from app.models.finance import (
    Discount, Invoice, InvoiceItem, Payment,
    DiscountType, InvoiceStatus, PaymentMethod
)
from app.routers.auth import get_password_hash
from app.services.billing_service import BillingService
from app.services.payment_service import PaymentService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Skipping seed.")
            return

        print("[INFO] Seeding Brightloop database with demo data...")

        # 1. Users
        admin_user = User(
            email="admin@brightloop.com",
            full_name="Admin Brightloop",
            hashed_password=get_password_hash("Admin@12345"),  # Meets strict password requirements
            role=UserRole.ADMIN
        )
        staff_user = User(
            email="staff@brightloop.com",
            full_name="Haaniah Operations",
            hashed_password=get_password_hash("Staff@12345"),
            role=UserRole.STAFF
        )
        customer_user = User(
            email="acme@corp.com",
            full_name="John Acme",
            hashed_password=get_password_hash("Customer@12345"),
            role=UserRole.CUSTOMER
        )
        db.add_all([admin_user, staff_user, customer_user])
        db.commit()

        # 2. Customers
        c1 = Customer(
            company_name="Acme Corporation",
            contact_name="John Acme",
            email="acme@corp.com",
            phone="+91 98765 43210",
            billing_address="12 MG Road, Bangalore, KA, India",
            tax_id="29ABCDE1234F1Z5",
            user_id=customer_user.id
        )
        c2 = Customer(
            company_name="TechSphere Solutions",
            contact_name="Priya Sharma",
            email="priya@techsphere.io",
            phone="+91 98111 22233",
            billing_address="45 BKC Complex, Mumbai, MH, India",
            tax_id="27XYZAB9876C1Z3"
        )
        c3 = Customer(
            company_name="Apex Logistics Ltd",
            contact_name="Rajesh Patel",
            email="rajesh@apexlogistics.in",
            phone="+91 99222 33445",
            billing_address="88 Salt Lake Sector V, Kolkata, WB, India",
            tax_id="19KLMNO5678D1Z9"
        )
        c4 = Customer(
            company_name="Starlight Media",
            contact_name="Ananya Roy",
            email="ananya@starlight.com",
            phone="+91 97333 44556",
            billing_address="10 Cyber City, Gurugram, HR, India",
            tax_id="06PQRST1122E1Z2"
        )
        db.add_all([c1, c2, c3, c4])
        db.commit()

        # 3. Products & Variants (from problem statement example: Business Software ₹2000, Odoo variant +₹560)
        p1 = Product(
            name="Business Software Suite",
            product_type="software",
            sales_price=Decimal("2000.00"),
            cost_price=Decimal("800.00"),
            description="Core enterprise management and automation platform."
        )
        p2 = Product(
            name="Cloud Analytics Add-on",
            product_type="add-on",
            sales_price=Decimal("1200.00"),
            cost_price=Decimal("400.00"),
            description="Real-time predictive analytics and reporting module."
        )
        p3 = Product(
            name="24/7 Dedicated Support",
            product_type="service",
            sales_price=Decimal("800.00"),
            cost_price=Decimal("300.00"),
            description="Priority SLA support with dedicated account manager."
        )
        db.add_all([p1, p2, p3])
        db.commit()

        v1 = Variant(product_id=p1.id, variant_name="Odoo Edition", additional_price=Decimal("560.00"))
        v2 = Variant(product_id=p1.id, variant_name="Enterprise Plus", additional_price=Decimal("1000.00"))
        db.add_all([v1, v2])
        db.commit()

        # 4. Subscription Plans
        plan_monthly = Plan(
            name="Enterprise Monthly Plan",
            price=Decimal("2560.00"),
            billing_frequency=BillingFrequency.MONTHLY,
            minimum_quantity=1,
            auto_close=False,
            early_close=True,
            pause_enabled=True,
            renewal_enabled=True
        )
        plan_yearly = Plan(
            name="Enterprise Annual Plan",
            price=Decimal("25000.00"),
            billing_frequency=BillingFrequency.YEARLY,
            minimum_quantity=1,
            auto_close=False,
            early_close=True,
            pause_enabled=True,
            renewal_enabled=True
        )
        plan_starter = Plan(
            name="Starter Monthly Plan",
            price=Decimal("1200.00"),
            billing_frequency=BillingFrequency.MONTHLY,
            minimum_quantity=1,
            auto_close=False,
            early_close=True,
            pause_enabled=True,
            renewal_enabled=True
        )
        db.add_all([plan_monthly, plan_yearly, plan_starter])
        db.commit()

        # 5. Discount Rules
        d1 = Discount(
            code="WELCOME10",
            name="10% Welcome Discount",
            discount_type=DiscountType.PERCENTAGE,
            discount_value=Decimal("10.00"),
            min_purchase_amount=Decimal("1000.00"),
            min_quantity=1,
            is_active=True,
            max_uses=100
        )
        d2 = Discount(
            code="FLAT500",
            name="₹500 Fixed Off Enterprise",
            discount_type=DiscountType.FIXED,
            discount_value=Decimal("500.00"),
            min_purchase_amount=Decimal("2000.00"),
            min_quantity=1,
            is_active=True,
            max_uses=50
        )
        db.add_all([d1, d2])
        db.commit()

        # 6. Subscriptions
        today = date.today()

        # Sub 1: Acme Corp - Active, due today
        sub1 = Subscription(
            subscription_number="SUB-202610-0001",
            customer_id=c1.id,
            plan_id=plan_monthly.id,
            status=SubscriptionStatus.ACTIVE,
            start_date=today - timedelta(days=60),
            next_billing_date=today,
            payment_terms="Net 15",
            quantity=1,
            unit_price=Decimal("2560.00"),
            tax_rate=Decimal("18.00"),
            total_amount=Decimal("2560.00"),
            auto_renew=True
        )
        db.add(sub1)
        db.flush()

        item1 = SubscriptionItem(
            subscription_id=sub1.id,
            product_id=p1.id,
            variant_id=v1.id,
            quantity=1,
            unit_price=Decimal("2000.00"),
            additional_price=Decimal("560.00"),
            line_total=Decimal("2560.00")
        )
        db.add(item1)

        # Sub 2: TechSphere - Active, due today
        sub2 = Subscription(
            subscription_number="SUB-202610-0002",
            customer_id=c2.id,
            plan_id=plan_starter.id,
            status=SubscriptionStatus.ACTIVE,
            start_date=today - timedelta(days=30),
            next_billing_date=today,
            payment_terms="Due on receipt",
            quantity=2,
            unit_price=Decimal("1200.00"),
            tax_rate=Decimal("18.00"),
            total_amount=Decimal("2400.00"),
            auto_renew=True
        )
        db.add(sub2)
        db.flush()

        item2 = SubscriptionItem(
            subscription_id=sub2.id,
            product_id=p2.id,
            quantity=2,
            unit_price=Decimal("1200.00"),
            additional_price=Decimal("0.00"),
            line_total=Decimal("2400.00")
        )
        db.add(item2)

        # Sub 3: Apex Logistics - Active, next billing in 15 days
        sub3 = Subscription(
            subscription_number="SUB-202610-0003",
            customer_id=c3.id,
            plan_id=plan_yearly.id,
            status=SubscriptionStatus.ACTIVE,
            start_date=today - timedelta(days=180),
            next_billing_date=today + timedelta(days=15),
            payment_terms="Net 30",
            quantity=1,
            unit_price=Decimal("25000.00"),
            tax_rate=Decimal("18.00"),
            total_amount=Decimal("25000.00"),
            auto_renew=True
        )
        db.add(sub3)

        # Sub 4: Starlight Media - Draft
        sub4 = Subscription(
            subscription_number="SUB-202610-0004",
            customer_id=c4.id,
            plan_id=plan_monthly.id,
            status=SubscriptionStatus.DRAFT,
            start_date=today,
            payment_terms="Due on receipt",
            quantity=1,
            unit_price=Decimal("2560.00"),
            tax_rate=Decimal("18.00"),
            total_amount=Decimal("2560.00"),
            auto_renew=True
        )
        db.add(sub4)
        db.commit()

        # 7. Seed Past Invoices & Payments to demonstrate Overdue, Paid, and Partially Paid
        # Past invoice 1 (Fully Paid) for Acme Corp
        inv_paid = Invoice(
            invoice_number="INV-202609-0001",
            customer_id=c1.id,
            subscription_id=sub1.id,
            billing_period_start=today - timedelta(days=60),
            billing_period_end=today - timedelta(days=31),
            issue_date=today - timedelta(days=60),
            due_date=today - timedelta(days=45),
            subtotal=Decimal("2560.00"),
            discount_amount=Decimal("256.00"),  # 10% WELCOME10
            taxable_amount=Decimal("2304.00"),
            tax_rate=Decimal("18.00"),
            tax_amount=Decimal("414.72"),
            total_amount=Decimal("2718.72"),
            amount_paid=Decimal("2718.72"),
            outstanding_amount=Decimal("0.00"),
            status=InvoiceStatus.PAID,
            notes="Fully settled on time."
        )
        db.add(inv_paid)
        db.flush()

        inv_item1 = InvoiceItem(
            invoice_id=inv_paid.id,
            product_name="Business Software Suite (Odoo Edition)",
            quantity=1,
            unit_price=Decimal("2560.00"),
            line_total=Decimal("2560.00")
        )
        db.add(inv_item1)

        pay1 = Payment(
            payment_number="PAY-202609-0001",
            invoice_id=inv_paid.id,
            amount=Decimal("2718.72"),
            payment_method=PaymentMethod.BANK_TRANSFER,
            payment_date=today - timedelta(days=50),
            transaction_reference="HDFC-IMPS-8732187"
        )
        db.add(pay1)

        # Past invoice 2 (OVERDUE!) for Apex Logistics
        inv_overdue = Invoice(
            invoice_number="INV-202609-0002",
            customer_id=c3.id,
            subscription_id=sub3.id,
            billing_period_start=today - timedelta(days=45),
            billing_period_end=today - timedelta(days=16),
            issue_date=today - timedelta(days=45),
            due_date=today - timedelta(days=15),  # 15 days ago -> OVERDUE!
            subtotal=Decimal("5000.00"),
            discount_amount=Decimal("0.00"),
            taxable_amount=Decimal("5000.00"),
            tax_rate=Decimal("18.00"),
            tax_amount=Decimal("900.00"),
            total_amount=Decimal("5900.00"),
            amount_paid=Decimal("0.00"),
            outstanding_amount=Decimal("5900.00"),
            status=InvoiceStatus.OVERDUE,
            notes="Payment reminder sent twice."
        )
        db.add(inv_overdue)
        db.flush()

        inv_item2 = InvoiceItem(
            invoice_id=inv_overdue.id,
            product_name="Enterprise Consulting & Setup",
            quantity=1,
            unit_price=Decimal("5000.00"),
            line_total=Decimal("5000.00")
        )
        db.add(inv_item2)

        # Past invoice 3 (PARTIALLY PAID) for TechSphere
        inv_partial = Invoice(
            invoice_number="INV-202610-0001",
            customer_id=c2.id,
            subscription_id=sub2.id,
            billing_period_start=today - timedelta(days=30),
            billing_period_end=today - timedelta(days=1),
            issue_date=today - timedelta(days=30),
            due_date=today + timedelta(days=5),
            subtotal=Decimal("2400.00"),
            discount_amount=Decimal("0.00"),
            taxable_amount=Decimal("2400.00"),
            tax_rate=Decimal("18.00"),
            tax_amount=Decimal("432.00"),
            total_amount=Decimal("2832.00"),
            amount_paid=Decimal("1500.00"),
            outstanding_amount=Decimal("1332.00"),
            status=InvoiceStatus.PARTIALLY_PAID,
            notes="Partial advance received via UPI."
        )
        db.add(inv_partial)
        db.flush()

        inv_item3 = InvoiceItem(
            invoice_id=inv_partial.id,
            product_name="Cloud Analytics Add-on (2 Seats)",
            quantity=2,
            unit_price=Decimal("1200.00"),
            line_total=Decimal("2400.00")
        )
        db.add(inv_item3)

        pay2 = Payment(
            payment_number="PAY-202610-0001",
            invoice_id=inv_partial.id,
            amount=Decimal("1500.00"),
            payment_method=PaymentMethod.UPI,
            payment_date=today - timedelta(days=10),
            transaction_reference="UPI-982187319827"
        )
        db.add(pay2)

        db.commit()
        print("[SUCCESS] Database successfully seeded with demo data!")
        print("   - Admin: admin@brightloop.com (Admin@12345)")
        print("   - Staff: staff@brightloop.com (Staff@12345)")
        print("   - Customer: acme@corp.com (Customer@12345)")
        print("   - Invoices: 1 Paid, 1 Overdue, 1 Partially Paid")
        print("   - Active due subscriptions ready for /api/billing/generate-due demo!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
