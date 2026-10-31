import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import database as database_module
from app import main as main_module
from app.database import Base, get_db
from app.main import app
from app.utils.seed_data import seed_database

# In-memory test SQLite engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Keep the app lifespan and any default database sessions isolated from the
# configured local database when TestClient starts the application.
database_module.engine = engine
database_module.SessionLocal = TestingSessionLocal
main_module.engine = engine


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
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
def admin_headers(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@brightloop.com", "password": "Admin@Brightloop123!"},
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_headers(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "staff@brightloop.com", "password": "Staff@Brightloop123!"},
    )
    assert response.status_code == 200, f"Staff login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def customer_headers(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "customer@acme.com", "password": "Customer@Brightloop123!"},
    )
    assert response.status_code == 200, f"Customer login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
