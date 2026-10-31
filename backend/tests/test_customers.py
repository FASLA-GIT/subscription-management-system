def test_list_customers_as_admin(client, admin_headers):
    response = client.get("/api/customers", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    emails = [c["email"] for c in data["items"]]
    assert "customer@acme.com" in emails


def test_list_customers_as_customer(client, customer_headers):
    response = client.get("/api/customers", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["email"] == "customer@acme.com"


def test_create_customer_as_staff(client, staff_headers):
    payload = {
        "name": "Beta Corp Admin",
        "company_name": "Beta Technologies",
        "email": "contact@betacorp.in",
        "phone": "+91 9123456789",
        "address_line1": "Electronic City",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postal_code": "560100",
        "country": "India",
        "tax_id": "29XYZAB5678C1Z2",
    }
    response = client.post("/api/customers", json=payload, headers=staff_headers)
    assert response.status_code == 201
    created = response.json()
    assert created["company_name"] == "Beta Technologies"
    assert created["email"] == "contact@betacorp.in"


def test_customer_cannot_create_customer(client, customer_headers):
    payload = {
        "name": "Unauthorized Corp",
        "email": "unauthorized@corp.com",
    }
    response = client.post("/api/customers", json=payload, headers=customer_headers)
    assert response.status_code == 403


def test_update_customer_profile(client, customer_headers):
    # Customer gets own profile
    me_res = client.get("/api/customers/me", headers=customer_headers)
    assert me_res.status_code == 200
    cust_id = me_res.json()["id"]

    # Customer updates their phone and address
    update_res = client.put(
        f"/api/customers/{cust_id}",
        json={"phone": "+91 9000000000", "address_line1": "New Suite 500"},
        headers=customer_headers,
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["phone"] == "+91 9000000000"
    assert updated_data["address_line1"] == "New Suite 500"
