import pytest
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.models.customer import Customer
from app.models.product import Product, ProductVariant
from app.models.plan import Plan
from app.models.subscription import Subscription, SubscriptionItem
from app.schemas.product import ProductCreate, VariantCreate
from app.schemas.plan import PlanCreate
from app.routers.products import create_product, get_product, list_products
from app.routers.plans import create_plan, list_plans
from app.routers.subscriptions import list_due_subscriptions, advance_billing_date
from app.services.billing_calculator import (
    compute_next_billing_date,
    compute_billing_period,
    calculate_line_item,
    calculate_subscription_totals,
    round_currency
)
from app.services.subscription_service import (
    create_subscription,
    transition_subscription_status,
    pause_subscription,
    resume_subscription,
    close_subscription,
    renew_subscription,
    generate_subscription_number
)


@pytest.fixture(scope="function")
def db_session():
    """Provides an isolated in-memory database session for each test."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    test_session_local = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = test_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


# --- 1. BILLING CALCULATOR & DATE ARITHMETIC TESTS ---

def test_daily_billing_frequency():
    start = date(2026, 1, 15)
    next_date = compute_next_billing_date(start, "daily")
    assert next_date == date(2026, 1, 16)


def test_weekly_billing_frequency():
    start = date(2026, 1, 15)
    next_date = compute_next_billing_date(start, "weekly")
    assert next_date == date(2026, 1, 22)


def test_monthly_billing_frequency_normal():
    start = date(2026, 1, 15)
    next_date = compute_next_billing_date(start, "monthly")
    assert next_date == date(2026, 2, 15)


def test_monthly_billing_month_end_jan_to_feb():
    # Jan 31 -> Feb 28 in non-leap year (2026)
    start = date(2026, 1, 31)
    next_date = compute_next_billing_date(start, "monthly")
    assert next_date == date(2026, 2, 28)


def test_monthly_billing_month_end_leap_year():
    # Jan 31, 2024 (leap year) -> Feb 29, 2024
    start = date(2024, 1, 31)
    next_date = compute_next_billing_date(start, "monthly")
    assert next_date == date(2024, 2, 29)


def test_monthly_billing_mar_31_to_apr_30():
    start = date(2026, 3, 31)
    next_date = compute_next_billing_date(start, "monthly")
    assert next_date == date(2026, 4, 30)


def test_yearly_billing_normal_and_leap():
    start_normal = date(2026, 6, 1)
    assert compute_next_billing_date(start_normal, "yearly") == date(2027, 6, 1)

    start_leap = date(2024, 2, 29)
    assert compute_next_billing_date(start_leap, "yearly") == date(2025, 2, 28)


def test_invalid_billing_frequency_raises_error():
    with pytest.raises(ValueError) as exc:
        compute_next_billing_date(date(2026, 1, 1), "bi-monthly")
    assert "Invalid billing frequency" in str(exc.value)


def test_billing_period_calculation():
    start = date(2026, 1, 1)
    p_start, p_end = compute_billing_period(start, "monthly")
    assert p_start == date(2026, 1, 1)
    assert p_end == date(2026, 1, 31)


# --- 2. FINANCIAL & PRECISION TESTS ---

def test_financial_totals_calculation():
    items = [
        {"unit_price": 2560.00, "quantity": 2},  # 5120.00
        {"unit_price": 499.00, "quantity": 1}    # 499.00
    ]
    # subtotal = 5619.00
    # discount = 500.00 -> taxable = 5119.00
    # tax 18% of 5119.00 = 921.42
    # total = 6040.42
    result = calculate_subscription_totals(
        items=items,
        plan_base_price=0.0,
        tax_percentage=18.0,
        discount_amount=500.0
    )
    assert result["subtotal"] == 5619.00
    assert result["discount_amount"] == 500.00
    assert result["tax_amount"] == 921.42
    assert result["total_amount"] == 6040.42


def test_discount_capped_at_subtotal():
    items = [{"unit_price": 1000.00, "quantity": 1}]
    result = calculate_subscription_totals(items=items, tax_percentage=18.0, discount_amount=1500.0)
    assert result["subtotal"] == 1000.00
    assert result["discount_amount"] == 1000.00
    assert result["tax_amount"] == 0.00
    assert result["total_amount"] == 0.00


# --- 3. PRODUCT & VARIANT LIFECYCLE TESTS ---

def test_product_with_variant_pricing(db_session):
    prod = Product(name="Enterprise ERP", sales_price=2000.0, cost_price=1000.0)
    db_session.add(prod)
    db_session.flush()

    var = ProductVariant(product_id=prod.id, name="Odoo Edition", additional_price=560.0)
    db_session.add(var)
    db_session.commit()

    assert prod.sales_price == 2000.0
    assert len(prod.variants) == 1
    assert prod.variants[0].name == "Odoo Edition"
    assert prod.variants[0].additional_price == 560.0
    # Unit price = 2000 + 560 = 2560
    assert prod.sales_price + prod.variants[0].additional_price == 2560.0


# --- 4. SUBSCRIPTION CREATION & SNAPSHOT PRICING TESTS ---

def test_subscription_creation(db_session):
    cust = Customer(name="Test Customer", email="test@domain.com")
    prod = Product(name="Cloud ERP", sales_price=2000.0)
    db_session.add_all([cust, prod])
    db_session.flush()

    var = ProductVariant(product_id=prod.id, name="Pro Variant", additional_price=500.0)
    plan = Plan(name="Monthly Pro", price=0.0, billing_frequency="monthly")
    db_session.add_all([var, plan])
    db_session.commit()

    items_data = [{"product_id": prod.id, "variant_id": var.id, "quantity": 2}]
    sub = create_subscription(
        db=db_session,
        customer_id=cust.id,
        plan_id=plan.id,
        items_data=items_data,
        status="active",
        tax_percentage=18.0
    )

    assert sub.id is not None
    assert sub.subscription_number.startswith("SUB-")
    assert sub.status == "active"
    # Unit price snapshot should be 2500
    assert len(sub.items) == 1
    assert sub.items[0].unit_price == 2500.0
    assert sub.items[0].quantity == 2
    assert sub.items[0].subtotal == 5000.0
    assert sub.subtotal == 5000.0
    assert sub.tax_amount == 900.0  # 18% of 5000
    assert sub.total_amount == 5900.0
    assert sub.next_billing_date.date() == compute_next_billing_date(sub.start_date.date(), "monthly")


def test_unique_subscription_numbers(db_session):
    cust = Customer(name="Customer A", email="a@test.com")
    prod = Product(name="Software A", sales_price=100.0)
    plan = Plan(name="Daily Plan", billing_frequency="daily")
    db_session.add_all([cust, prod, plan])
    db_session.commit()

    sub1 = create_subscription(db_session, cust.id, plan.id, [{"product_id": prod.id, "quantity": 1}])
    sub2 = create_subscription(db_session, cust.id, plan.id, [{"product_id": prod.id, "quantity": 1}])

    assert sub1.subscription_number != sub2.subscription_number
    assert sub1.subscription_number.endswith("0001")
    assert sub2.subscription_number.endswith("0002")


# --- 5. LIFECYCLE STATE TRANSITIONS TESTS ---

def test_subscription_lifecycle_flow(db_session):
    cust = Customer(name="Client Flow", email="flow@client.com")
    prod = Product(name="Flow Software", sales_price=500.0)
    plan = Plan(name="Monthly Flow", billing_frequency="monthly")
    db_session.add_all([cust, prod, plan])
    db_session.commit()

    # Draft
    sub = create_subscription(db_session, cust.id, plan.id, [{"product_id": prod.id, "quantity": 1}], status="draft")
    assert sub.status == "draft"

    # Draft -> Quotation
    sub = transition_subscription_status(db_session, sub.id, "quotation")
    assert sub.status == "quotation"

    # Quotation -> Confirmed
    sub = transition_subscription_status(db_session, sub.id, "confirmed")
    assert sub.status == "confirmed"

    # Confirmed -> Active
    sub = transition_subscription_status(db_session, sub.id, "active")
    assert sub.status == "active"
    assert sub.next_billing_date is not None

    # Active -> Paused
    sub = pause_subscription(db_session, sub.id)
    assert sub.status == "paused"
    assert sub.pause_date == date.today()

    # Paused -> Active (Resume)
    sub = resume_subscription(db_session, sub.id)
    assert sub.status == "active"

    # Active -> Closed
    sub = close_subscription(db_session, sub.id, reason="Customer cancelled")
    assert sub.status == "closed"
    assert sub.closed_date == date.today()
    assert sub.close_reason == "Customer cancelled"

    # Closed -> Disallowed transition to quotation
    with pytest.raises(ValueError) as exc:
        transition_subscription_status(db_session, sub.id, "quotation")
    assert "Invalid status transition" in str(exc.value)

    # Closed -> Renew to Active
    sub = renew_subscription(db_session, sub.id)
    assert sub.status == "active"
    assert sub.closed_date is None


# --- 6. API ROUTER ENDPOINTS INTEGRATION TESTS ---

def test_api_products_crud(db_session):
    new_prod = ProductCreate(
        name="Brightloop CRM",
        product_type="Software",
        sales_price=1800.0,
        cost_price=600.0,
        description="Customer relationship management",
        is_active=True,
        variants=[VariantCreate(name="AI Module", additional_price=400.0)]
    )
    created = create_product(product_in=new_prod, db=db_session)
    assert created.id is not None
    assert created.name == "Brightloop CRM"
    assert len(created.variants) == 1
    assert created.variants[0].additional_price == 400.0

    retrieved = get_product(product_id=created.id, db=db_session)
    assert retrieved.id == created.id
    assert retrieved.sales_price == 1800.0

    all_prods = list_products(is_active=True, product_type=None, search="CRM", db=db_session)
    assert len(all_prods) >= 1
    assert any(p.name == "Brightloop CRM" for p in all_prods)


def test_api_plans_crud(db_session):
    new_plan = PlanCreate(
        name="Annual Business",
        price=12000.0,
        billing_frequency="yearly",
        minimum_quantity=1,
        auto_close=False,
        allow_pause=True,
        allow_renewal=True
    )
    created = create_plan(plan_in=new_plan, db=db_session)
    assert created.id is not None
    assert created.billing_frequency == "yearly"

    plans = list_plans(is_active=True, billing_frequency="yearly", db=db_session)
    assert len(plans) >= 1
    assert any(p.name == "Annual Business" for p in plans)


def test_api_due_subscriptions_query(db_session):
    cust = Customer(name="Due Customer", email="due@client.com")
    prod = Product(name="Server Pack", sales_price=1000.0)
    plan = Plan(name="Monthly Pack", billing_frequency="monthly")
    db_session.add_all([cust, prod, plan])
    db_session.commit()

    today = date.today()

    sub_due = create_subscription(
        db=db_session,
        customer_id=cust.id,
        plan_id=plan.id,
        items_data=[{"product_id": prod.id, "quantity": 1}],
        status="active",
        start_date=today - timedelta(days=30)
    )
    sub_due.next_billing_date = today
    db_session.commit()

    due_list = list_due_subscriptions(due_date=today, db=db_session)
    assert len(due_list) == 1
    assert due_list[0].subscription_number == sub_due.subscription_number

    # Advance billing date (Iha Finance module coordination)
    adv_sub = advance_billing_date(subscription_id=sub_due.id, db=db_session)
    next_bill = adv_sub.next_billing_date.date() if hasattr(adv_sub.next_billing_date, "date") else adv_sub.next_billing_date
    assert next_bill == compute_next_billing_date(today, "monthly")
