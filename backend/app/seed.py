from datetime import date, timedelta
from app.database import engine, SessionLocal, Base
from app.models.customer import Customer
from app.models.user import User
from app.models.product import Product, ProductVariant
from app.models.plan import Plan
from app.models.subscription import Subscription, SubscriptionItem
from app.services.billing_calculator import compute_next_billing_date, calculate_subscription_totals


def seed_database():
    """Seeds realistic demo data for the Brightloop Subscription Management System."""
    print("Dropping existing tables and recreating schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        today = date.today()

        # 1. Seed Customers
        print("Seeding Customers...")
        cust1 = Customer(
            name="Apex Retailers Ltd.",
            email="accounts@apexretailers.com",
            phone="+91 98765 43210",
            company_name="Apex Retailers Pvt Ltd",
            billing_address="Shop 14, Commercial Complex, MG Road, Bengaluru",
            gst_number="29ABCDE1234F1Z5"
        )
        cust2 = Customer(
            name="Innovatech Solutions",
            email="billing@innovatech.io",
            phone="+91 91234 56789",
            company_name="Innovatech Software Labs",
            billing_address="Tower B, Infotech Park, Hinjawadi, Pune",
            gst_number="27FGHIJ5678K1Z2"
        )
        cust3 = Customer(
            name="Nexus Logistics",
            email="ops@nexuslogistics.in",
            phone="+91 99887 76655",
            company_name="Nexus Supply Chain Solutions",
            billing_address="Plot 45, Industrial Area, Gurugram, Haryana",
            gst_number="06KLMNO9012P1Z8"
        )
        db.add_all([cust1, cust2, cust3])
        db.flush()

        # 2. Seed Products and Variants
        print("Seeding Products and Variants...")
        # Product 1: Business Software
        prod_erp = Product(
            name="Brightloop Business Software",
            product_type="Software",
            sales_price=2000.0,
            cost_price=800.0,
            description="All-in-one business management and ERP software suite.",
            is_active=True
        )
        db.add(prod_erp)
        db.flush()

        v_odoo = ProductVariant(
            product_id=prod_erp.id,
            name="Odoo Connector Edition",
            additional_price=560.0
        )
        v_ent = ProductVariant(
            product_id=prod_erp.id,
            name="Enterprise Multi-Branch Edition",
            additional_price=1200.0
        )
        db.add_all([v_odoo, v_ent])

        # Product 2: CRM Suite
        prod_crm = Product(
            name="Brightloop CRM Pro",
            product_type="Software",
            sales_price=1500.0,
            cost_price=500.0,
            description="Lead management, customer tracking, and pipeline forecasting.",
            is_active=True
        )
        db.add(prod_crm)
        db.flush()

        v_crm_ai = ProductVariant(
            product_id=prod_crm.id,
            name="AI Sentiment Analysis Add-on",
            additional_price=450.0
        )
        db.add(v_crm_ai)

        # Product 3: Cloud Storage
        prod_storage = Product(
            name="Secure Cloud Storage",
            product_type="Add-on",
            sales_price=499.0,
            cost_price=150.0,
            description="Encrypted cloud backup with automated daily snapshots.",
            is_active=True
        )
        db.add(prod_storage)
        db.flush()

        v_storage_1tb = ProductVariant(
            product_id=prod_storage.id,
            name="1 TB Extra Quota",
            additional_price=299.0
        )
        db.add(v_storage_1tb)

        # 3. Seed Subscription Plans
        print("Seeding Subscription Plans...")
        plan_daily = Plan(
            name="Daily Sandbox Trial",
            price=99.0,
            billing_frequency="daily",
            minimum_quantity=1,
            availability_start_date=today,
            allow_pause=True,
            allow_renewal=True,
            is_active=True
        )
        plan_weekly = Plan(
            name="Weekly Starter Plan",
            price=499.0,
            billing_frequency="weekly",
            minimum_quantity=1,
            availability_start_date=today,
            allow_pause=True,
            allow_renewal=True,
            is_active=True
        )
        plan_monthly = Plan(
            name="Monthly Professional",
            price=2499.0,
            billing_frequency="monthly",
            minimum_quantity=1,
            availability_start_date=today,
            allow_pause=True,
            allow_renewal=True,
            is_active=True
        )
        plan_yearly = Plan(
            name="Annual Enterprise Suite",
            price=24999.0,
            billing_frequency="yearly",
            minimum_quantity=2,
            availability_start_date=today,
            auto_close=False,
            allow_pause=True,
            allow_renewal=True,
            is_active=True
        )
        db.add_all([plan_daily, plan_weekly, plan_monthly, plan_yearly])
        db.flush()

        # 4. Seed Subscriptions demonstrating all lifecycle states
        print("Seeding Subscriptions across Lifecycle states...")

        # Sub 1: Active and DUE TODAY (Ready for Iha's invoice generation feature)
        # Unit price = Business Software (2000) + Odoo (560) = 2560
        sub1_items = [{"unit_price": 2560.0, "quantity": 1}]
        sub1_totals = calculate_subscription_totals(sub1_items, plan_base_price=0.0, tax_percentage=18.0)

        sub1 = Subscription(
            subscription_number="SUB-2026-0001",
            customer_id=cust1.id,
            plan_id=plan_monthly.id,
            status="active",
            start_date=today - timedelta(days=30),
            next_billing_date=today,  # DUE FOR BILLING!
            payment_terms="Net 15",
            subtotal=sub1_totals["subtotal"],
            tax_percentage=18.0,
            tax_amount=sub1_totals["tax_amount"],
            discount_amount=0.0,
            total_amount=sub1_totals["total_amount"],
            notes="Key retail client; automated monthly billing with Odoo connector."
        )
        db.add(sub1)
        db.flush()

        item1 = SubscriptionItem(
            subscription_id=sub1.id,
            product_id=prod_erp.id,
            variant_id=v_odoo.id,
            quantity=1,
            unit_price=2560.0,
            subtotal=2560.0
        )
        db.add(item1)

        # Sub 2: Active (Billed recently, next due in 25 days)
        sub2_items = [{"unit_price": 1950.0, "quantity": 2}]
        sub2_totals = calculate_subscription_totals(sub2_items, plan_base_price=0.0, tax_percentage=18.0)

        sub2 = Subscription(
            subscription_number="SUB-2026-0002",
            customer_id=cust2.id,
            plan_id=plan_monthly.id,
            status="active",
            start_date=today - timedelta(days=5),
            next_billing_date=today + timedelta(days=25),
            payment_terms="Immediate",
            subtotal=sub2_totals["subtotal"],
            tax_percentage=18.0,
            tax_amount=sub2_totals["tax_amount"],
            discount_amount=0.0,
            total_amount=sub2_totals["total_amount"],
            notes="Innovatech CRM deployment."
        )
        db.add(sub2)
        db.flush()

        item2 = SubscriptionItem(
            subscription_id=sub2.id,
            product_id=prod_crm.id,
            variant_id=v_crm_ai.id,
            quantity=2,
            unit_price=1950.0,
            subtotal=3900.0
        )
        db.add(item2)

        # Sub 3: Quotation State (Draft estimate sent to Nexus Logistics)
        sub3_items = [{"unit_price": 3200.0, "quantity": 3}]
        sub3_totals = calculate_subscription_totals(sub3_items, plan_base_price=0.0, tax_percentage=18.0, discount_amount=500.0)

        sub3 = Subscription(
            subscription_number="SUB-2026-0003",
            customer_id=cust3.id,
            plan_id=plan_yearly.id,
            status="quotation",
            start_date=today,
            expiry_date=today + timedelta(days=14),
            next_billing_date=None,
            payment_terms="Net 30",
            subtotal=sub3_totals["subtotal"],
            tax_percentage=18.0,
            tax_amount=sub3_totals["tax_amount"],
            discount_amount=500.0,
            total_amount=sub3_totals["total_amount"],
            notes="Quotation for Nexus Logistics 3 multi-branch licenses with 500 discount."
        )
        db.add(sub3)
        db.flush()

        item3 = SubscriptionItem(
            subscription_id=sub3.id,
            product_id=prod_erp.id,
            variant_id=v_ent.id,
            quantity=3,
            unit_price=3200.0,
            subtotal=9600.0
        )
        db.add(item3)

        # Sub 4: Paused State
        sub4_totals = calculate_subscription_totals([{"unit_price": 798.0, "quantity": 1}], tax_percentage=18.0)
        sub4 = Subscription(
            subscription_number="SUB-2026-0004",
            customer_id=cust1.id,
            plan_id=plan_monthly.id,
            status="paused",
            start_date=today - timedelta(days=40),
            pause_date=today - timedelta(days=5),
            next_billing_date=today + timedelta(days=10),
            payment_terms="Immediate",
            subtotal=sub4_totals["subtotal"],
            tax_percentage=18.0,
            tax_amount=sub4_totals["tax_amount"],
            discount_amount=0.0,
            total_amount=sub4_totals["total_amount"],
            notes="Temporarily paused on customer request due to office relocation."
        )
        db.add(sub4)
        db.flush()

        item4 = SubscriptionItem(
            subscription_id=sub4.id,
            product_id=prod_storage.id,
            variant_id=v_storage_1tb.id,
            quantity=1,
            unit_price=798.0,
            subtotal=798.0
        )
        db.add(item4)

        # Sub 5: Closed State
        sub5_totals = calculate_subscription_totals([{"unit_price": 100.0, "quantity": 1}], tax_percentage=18.0)
        sub5 = Subscription(
            subscription_number="SUB-2026-0005",
            customer_id=cust2.id,
            plan_id=plan_daily.id,
            status="closed",
            start_date=today - timedelta(days=60),
            closed_date=today - timedelta(days=55),
            close_reason="Trial period concluded; upgraded to Monthly.",
            next_billing_date=None,
            payment_terms="Immediate",
            subtotal=sub5_totals["subtotal"],
            tax_percentage=18.0,
            tax_amount=sub5_totals["tax_amount"],
            discount_amount=0.0,
            total_amount=sub5_totals["total_amount"],
            notes="Sandbox evaluation concluded."
        )
        db.add(sub5)
        db.flush()

        item5 = SubscriptionItem(
            subscription_id=sub5.id,
            product_id=prod_erp.id,
            variant_id=None,
            quantity=1,
            unit_price=2000.0,
            subtotal=2000.0
        )
        db.add(item5)

        db.commit()
        print("Seed completed successfully!")
        print(f"Created: 3 Customers, 3 Products with Variants, 4 Plans, 5 Subscriptions across all lifecycle states.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
