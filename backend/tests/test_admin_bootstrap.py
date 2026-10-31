import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.bootstrap_admin import create_first_admin
from app.database import Base, get_db
from app.main import app


def test_bootstrap_creates_first_admin_and_prevents_second_admin():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = session_local()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        admin = create_first_admin(db, "first-admin@example.com", "Safe-Admin-Password9!")
        assert admin.role == "admin"
        assert admin.hashed_password != "Safe-Admin-Password9!"

        with pytest.raises(ValueError, match="administrator account already exists"):
            create_first_admin(db, "second-admin@example.com", "Another-Safe-Password9!")

        with TestClient(app) as client:
            login = client.post(
                "/api/auth/login",
                json={"email": "first-admin@example.com", "password": "Safe-Admin-Password9!"},
            )
            assert login.status_code == 200
            token = login.json()["access_token"]
            profile = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert profile.status_code == 200
            assert profile.json()["role"] == "admin"
    finally:
        app.dependency_overrides.pop(get_db, None)
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
