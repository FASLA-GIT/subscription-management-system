def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_customer_registration_success(client):
    payload = {
        "email": "newuser@example.com",
        "password": "SecurePassword123!",
        "name": "Alice Tester",
        "company_name": "Testing Inc",
        "phone": "+91 9999988888",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "customer"
    assert data["email"] == "newuser@example.com"
    assert data["customer_id"] is not None


def test_customer_registration_password_complexity(client):
    # Too short (<= 8 chars)
    r1 = client.post(
        "/api/auth/register",
        json={"email": "short@example.com", "password": "Pass1!"},
    )
    assert r1.status_code == 422 or r1.status_code == 400

    # No uppercase
    r2 = client.post(
        "/api/auth/register",
        json={"email": "noupper@example.com", "password": "password123!"},
    )
    assert r2.status_code == 422 or r2.status_code == 400

    # No lowercase
    r3 = client.post(
        "/api/auth/register",
        json={"email": "nolower@example.com", "password": "PASSWORD123!"},
    )
    assert r3.status_code == 422 or r3.status_code == 400

    # No special character
    r4 = client.post(
        "/api/auth/register",
        json={"email": "nospecial@example.com", "password": "Password123"},
    )
    assert r4.status_code == 422 or r4.status_code == 400


def test_customer_registration_duplicate_email(client):
    payload = {
        "email": "admin@brightloop.com",
        "password": "Password123!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_login_success_and_me(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@brightloop.com", "password": "Admin@Brightloop123!"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token

    # Check /api/auth/me
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "admin@brightloop.com"
    assert me_data["role"] == "admin"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@brightloop.com", "password": "WrongPassword123!"},
    )
    assert response.status_code == 401


def test_admin_can_create_staff(client, admin_headers):
    payload = {
        "email": "operations@brightloop.com",
        "password": "OperationsStaff123!",
        "role": "staff",
    }
    response = client.post("/api/auth/staff", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "operations@brightloop.com"
    assert data["role"] == "staff"


def test_non_admin_cannot_create_staff(client, customer_headers):
    payload = {
        "email": "hacker@brightloop.com",
        "password": "OperationsStaff123!",
        "role": "staff",
    }
    response = client.post("/api/auth/staff", json=payload, headers=customer_headers)
    assert response.status_code == 403


def test_forgot_and_reset_password(client):
    # Register a dedicated user for password reset testing so seeded accounts remain unaffected
    client.post(
        "/api/auth/register",
        json={
            "email": "reset_tester@example.com",
            "password": "InitialPassword123!",
            "name": "Reset Tester",
        },
    )

    # Forgot password
    forgot_res = client.post(
        "/api/auth/forgot-password",
        json={"email": "reset_tester@example.com"},
    )
    assert forgot_res.status_code == 200
    token = forgot_res.json()["reset_token"]
    assert token

    # Reset password
    new_pass = "BrandNewPassword123@"
    reset_res = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": new_pass},
    )
    assert reset_res.status_code == 200

    # Login with new password
    login_res = client.post(
        "/api/auth/login",
        json={"email": "reset_tester@example.com", "password": new_pass},
    )
    assert login_res.status_code == 200
