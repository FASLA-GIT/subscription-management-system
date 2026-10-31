import time
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"


def test_endpoints():
    print(f"Connecting to live backend at {BASE_URL}...")

    # Wait for server to be responsive
    for attempt in range(15):
        try:
            r = requests.get(f"{BASE_URL}/api/health", timeout=2)
            if r.status_code == 200:
                print("Server is healthy and responding!")
                break
        except Exception:
            time.sleep(0.5)
    else:
        print("Server did not respond within timeout.")
        sys.exit(1)

    print("\n--- 1. Testing Root & Health Check ---")
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(f"[OK] GET / -> {r.json()['system']}")

    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    print(f"[OK] GET /api/health -> status: {r.json()['status']}")

    print("\n--- 2. Testing CORS Configuration for Vite (localhost:5173) ---")
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    }
    r = requests.options(f"{BASE_URL}/api/products", headers=headers)
    allow_origin = r.headers.get("access-control-allow-origin")
    print(f"CORS Access-Control-Allow-Origin: {allow_origin}")
    assert allow_origin in ("*", "http://localhost:5173"), f"CORS not allowing origin: {allow_origin}"
    print("[OK] CORS is properly configured for Vite frontend!")

    print("\n--- 3. Testing Products & Variants APIs ---")
    # List products
    r = requests.get(f"{BASE_URL}/api/products")
    assert r.status_code == 200
    print(f"[OK] GET /api/products -> {len(r.json())} products found")

    # Create product with variant
    prod_payload = {
        "name": "Cloud Inventory Tracker",
        "product_type": "Software",
        "sales_price": 3500.0,
        "cost_price": 1200.0,
        "description": "Real-time stock tracking and barcode scanning.",
        "is_active": True,
        "variants": [
            {"name": "Multi-Warehouse Add-on", "additional_price": 750.0}
        ]
    }
    r = requests.post(f"{BASE_URL}/api/products", json=prod_payload)
    assert r.status_code == 201, f"Failed: {r.text}"
    prod = r.json()
    prod_id = prod["id"]
    print(f"[OK] POST /api/products -> Created Product #{prod_id}: {prod['name']}, Variants: {len(prod['variants'])}")

    # Get single product
    r = requests.get(f"{BASE_URL}/api/products/{prod_id}")
    assert r.status_code == 200
    print(f"[OK] GET /api/products/{prod_id} -> Sales Price: INR {r.json()['sales_price']}")

    # Update product
    r = requests.put(f"{BASE_URL}/api/products/{prod_id}", json={"sales_price": 3800.0})
    assert r.status_code == 200
    assert r.json()["sales_price"] == 3800.0
    print(f"[OK] PUT /api/products/{prod_id} -> Updated price to INR 3800.0")

    # Add another variant to product
    r = requests.post(f"{BASE_URL}/api/products/{prod_id}/variants", json={
        "name": "Barcode Scanner Hardware Kit",
        "additional_price": 1500.0
    })
    assert r.status_code == 201
    var = r.json()
    var_id = var["id"]
    print(f"[OK] POST /api/products/{prod_id}/variants -> Created Variant #{var_id}: {var['name']} (+INR {var['additional_price']})")

    # List variants of product
    r = requests.get(f"{BASE_URL}/api/products/{prod_id}/variants")
    assert r.status_code == 200
    print(f"[OK] GET /api/products/{prod_id}/variants -> Found {len(r.json())} variants")

    print("\n--- 4. Testing Subscription Plans APIs ---")
    # List plans
    r = requests.get(f"{BASE_URL}/api/plans")
    assert r.status_code == 200
    print(f"[OK] GET /api/plans -> Found {len(r.json())} plans")

    # Create Plan
    plan_payload = {
        "name": "Quarterly Growth Plan",
        "price": 4500.0,
        "billing_frequency": "monthly",
        "minimum_quantity": 1,
        "auto_close": False,
        "allow_pause": True,
        "allow_renewal": True,
        "is_active": True
    }
    r = requests.post(f"{BASE_URL}/api/plans", json=plan_payload)
    assert r.status_code == 201, f"Failed: {r.text}"
    plan = r.json()
    plan_id = plan["id"]
    print(f"[OK] POST /api/plans -> Created Plan #{plan_id}: {plan['name']} ({plan['billing_frequency']})")

    # Get Plan
    r = requests.get(f"{BASE_URL}/api/plans/{plan_id}")
    assert r.status_code == 200
    print(f"[OK] GET /api/plans/{plan_id} -> Price: INR {r.json()['price']}")

    # Update Plan
    r = requests.put(f"{BASE_URL}/api/plans/{plan_id}", json={"price": 4900.0})
    assert r.status_code == 200
    assert r.json()["price"] == 4900.0
    print(f"[OK] PUT /api/plans/{plan_id} -> Updated price to INR 4900.0")

    print("\n--- 5. Testing Subscriptions & Lifecycle APIs ---")
    # List subscriptions
    r = requests.get(f"{BASE_URL}/api/subscriptions")
    assert r.status_code == 200
    print(f"[OK] GET /api/subscriptions -> Found {len(r.json())} existing subscriptions")

    # Ensure a customer exists (if database was reset by previous test)
    from app.database import SessionLocal
    from app.models.customer import Customer
    db = SessionLocal()
    cust = db.query(Customer).first()
    if not cust:
        cust = Customer(name="Acme Corporation", email="acme@corp.com")
        db.add(cust)
        db.commit()
        db.refresh(cust)
    cust_id = cust.id
    db.close()

    # Create new subscription
    sub_payload = {
        "customer_id": cust_id,
        "plan_id": plan_id,
        "status": "draft",
        "payment_terms": "Net 15",
        "tax_percentage": 18.0,
        "discount_amount": 200.0,
        "notes": "Frontend integration test subscription.",
        "items": [
            {
                "product_id": prod_id,
                "variant_id": var_id,
                "quantity": 2
            }
        ]
    }
    r = requests.post(f"{BASE_URL}/api/subscriptions", json=sub_payload)
    assert r.status_code == 201, f"Failed to create subscription: {r.text}"
    sub = r.json()
    sub_id = sub["id"]
    sub_num = sub["subscription_number"]
    print(f"[OK] POST /api/subscriptions -> Created Sub #{sub_id} ({sub_num}) in status '{sub['status']}'")
    print(f"     Subtotal: INR {sub['subtotal']}, Tax: INR {sub['tax_amount']}, Total: INR {sub['total_amount']}")

    # Get subscription details
    r = requests.get(f"{BASE_URL}/api/subscriptions/{sub_id}")
    assert r.status_code == 200
    print(f"[OK] GET /api/subscriptions/{sub_id} -> Verified items count: {len(r.json()['items'])}")

    # Lifecycle: draft -> quotation
    r = requests.patch(f"{BASE_URL}/api/subscriptions/{sub_id}/status", json={"status": "quotation"})
    assert r.status_code == 200
    assert r.json()["status"] == "quotation"
    print(f"[OK] PATCH /api/subscriptions/{sub_id}/status -> Transitioned to 'quotation'")

    # Lifecycle: quotation -> active (via convert-quote endpoint)
    r = requests.post(f"{BASE_URL}/api/subscriptions/{sub_id}/convert-quote?activate=true")
    if r.status_code != 200:
        print(f"convert-quote failed: {r.status_code} {r.text}")
    assert r.status_code == 200, f"convert-quote failed: {r.status_code} {r.text}"
    assert r.json()["status"] == "active"
    print(f"[OK] POST /api/subscriptions/{sub_id}/convert-quote -> Activated! Next Billing: {r.json()['next_billing_date']}")

    # Lifecycle: pause
    r = requests.post(f"{BASE_URL}/api/subscriptions/{sub_id}/pause")
    assert r.status_code == 200
    assert r.json()["status"] == "paused"
    print(f"[OK] POST /api/subscriptions/{sub_id}/pause -> Paused successfully (Pause Date: {r.json()['pause_date']})")

    # Lifecycle: resume
    r = requests.post(f"{BASE_URL}/api/subscriptions/{sub_id}/resume")
    assert r.status_code == 200
    assert r.json()["status"] == "active"
    print(f"[OK] POST /api/subscriptions/{sub_id}/resume -> Resumed successfully (Status: active)")

    # Query Due Subscriptions
    r = requests.get(f"{BASE_URL}/api/subscriptions/due")
    assert r.status_code == 200
    print(f"[OK] GET /api/subscriptions/due -> Found {len(r.json())} due subscriptions for billing")

    # Advance billing date (Finance module invoice trigger coordination)
    r = requests.post(f"{BASE_URL}/api/subscriptions/{sub_id}/advance-billing-date")
    assert r.status_code == 200
    print(f"[OK] POST /api/subscriptions/{sub_id}/advance-billing-date -> New Due Date: {r.json()['next_billing_date']}")

    # Close subscription
    r = requests.post(f"{BASE_URL}/api/subscriptions/{sub_id}/close", json={"reason": "Customer completed project."})
    assert r.status_code == 200
    assert r.json()["status"] == "closed"
    print(f"[OK] POST /api/subscriptions/{sub_id}/close -> Closed (Reason: {r.json()['close_reason']})")

    # Renew subscription
    r = requests.post(f"{BASE_URL}/api/subscriptions/{sub_id}/renew")
    assert r.status_code == 200
    assert r.json()["status"] == "active"
    print(f"[OK] POST /api/subscriptions/{sub_id}/renew -> Renewed and Reactivated! Next Billing: {r.json()['next_billing_date']}")

    print("\n=======================================================")
    print("ALL SUBSCRIPTION MODULE HTTP ENDPOINTS VERIFIED 100% OK!")
    print("=======================================================\n")


if __name__ == "__main__":
    test_endpoints()
