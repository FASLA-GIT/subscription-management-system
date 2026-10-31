import pytest
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models.user import User, Customer, UserRole
from app.models.subscription import Product, Variant, Plan, Subscription, SubscriptionItem, BillingFrequency, SubscriptionStatus
from app.models.finance import Discount, Invoice, Payment, DiscountType, InvoiceStatus, PaymentMethod

# Use StaticPool so all connections in test share the exact same in-memory SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_customer(db_session):
    customer = Customer(
        company_name="Apex Global Ltd",
        contact_name="Alice Smith",
        email="alice@apexglobal.com",
        billing_address="100 Technology Park",
        tax_id="GSTIN12345"
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer

@pytest.fixture
def sample_plan(db_session):
    plan = Plan(
        name="Business Pro Monthly",
        price=Decimal("2000.00"),
        billing_frequency=BillingFrequency.MONTHLY,
        minimum_quantity=1
    )
    db_session.add(plan)
    db_session.commit()
    db_session.refresh(plan)
    return plan

@pytest.fixture
def sample_product(db_session):
    product = Product(
        name="CRM Suite",
        product_type="software",
        sales_price=Decimal("2000.00"),
        cost_price=Decimal("800.00")
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product
