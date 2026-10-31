import pytest


@pytest.mark.parametrize("headers_fixture, expected_role", [
    ("admin_headers", "admin"),
    ("staff_headers", "staff"),
    ("customer_headers", "customer"),
])
def test_authenticated_roles_can_load_dashboard_and_financial_data(request, client, headers_fixture, expected_role):
    headers = request.getfixturevalue(headers_fixture)
    profile = client.get("/api/auth/me", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["role"] == expected_role

    for path in (
        "/api/dashboard/summary",
        "/api/dashboard/revenue",
        "/api/invoices",
        "/api/subscriptions",
        "/api/payments",
    ):
        response = client.get(path, headers=headers)
        assert response.status_code == 200, f"{expected_role} could not load {path}: {response.text}"


def test_customer_financial_data_is_limited_to_linked_customer(client, customer_headers):
    profile = client.get("/api/auth/me", headers=customer_headers).json()
    customer_id = profile["customer_id"]
    assert customer_id is not None

    for path in ("/api/invoices", "/api/subscriptions"):
        response = client.get(path, headers=customer_headers)
        assert response.status_code == 200
        assert all(row["customer_id"] == customer_id for row in response.json())

    payments = client.get("/api/payments", headers=customer_headers)
    assert payments.status_code == 200
    assert all(row["customer_name"] for row in payments.json())
