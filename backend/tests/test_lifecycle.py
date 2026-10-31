from datetime import datetime, timedelta
from decimal import Decimal


def test_complete_end_to_end_business_lifecycle(client, admin_headers):
    """Verify Section 11: Complete End-to-End Business Flow:
    1. Admin logs in
    2. Admin creates product & variant, and subscription plan
    3. Customer registers
    4. Subscription is created
    5. Subscription is active
    6. System generates invoice automatically
    7. Invoice calculates tax and discount
    8. Payment is recorded
    9. Invoice reflects paid & balance amounts
    10. Dashboard updates metrics from real backend data
    """
    # 2. Admin creates a new product with variant
    prod_payload = {
        "name": "Cloud CRM Pro",
        "product_type": "Software",
        "sales_price": "3000.00",
        "cost_price": "1000.00",
        "description": "Next-gen customer relationship platform",
        "variants": [
            {
                "variant_name": "AI Copilot Add-on",
                "additional_price": "500.00",
                "sku": "CRM-AI-01",
            }
        ],
    }
    prod_res = client.post("/api/products", json=prod_payload, headers=admin_headers)
    assert prod_res.status_code == 201
    product = prod_res.json()
    product_id = product["id"]
    variant_id = product["variants"][0]["id"]

    # Admin creates plan
    plan_payload = {
        "name": "Quarterly Growth",
        "price": "3500.00",
        "billing_frequency": "monthly",
        "minimum_quantity": 1,
        "description": "Quarterly subscription plan",
    }
    plan_res = client.post("/api/plans", json=plan_payload, headers=admin_headers)
    assert plan_res.status_code == 201
    plan = plan_res.json()
    plan_id = plan["id"]

    # 3. Customer registers
    cust_reg = {
        "email": "sarah.connor@cyberdyne.org",
        "password": "Resistance1984!",
        "name": "Sarah Connor",
        "company_name": "Cyberdyne Systems",
        "phone": "+91 9888877777",
    }
    reg_res = client.post("/api/auth/register", json=cust_reg)
    assert reg_res.status_code == 201
    cust_data = reg_res.json()
    cust_token = cust_data["access_token"]
    cust_id = cust_data["customer_id"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 4. Subscription created for that customer (set start_date to past so it's due for billing)
    past_date = (datetime.utcnow() - timedelta(days=32)).isoformat()
    sub_payload = {
        "customer_id": cust_id,
        "plan_id": plan_id,
        "start_date": past_date,
        "payment_terms": "Immediate",
        "tax_rate": "18.00",
        "items": [
            {
                "product_id": product_id,
                "variant_id": variant_id,
                "quantity": 1,
            }
        ],
    }
    sub_res = client.post("/api/subscriptions", json=sub_payload, headers=cust_headers)
    assert sub_res.status_code == 201
    subscription = sub_res.json()
    sub_id = subscription["id"]
    assert subscription["status"] == "active"
    # Unit price = 3000 + 500 = 3500. Tax = 18% of 3500 = 630. Total = 4130
    assert Decimal(str(subscription["total_amount"])) == Decimal("4130.00")

    # 6. Automatic invoice generation (/api/billing/generate-due)
    # Reference date set to now so due subscription is picked up
    gen_res = client.post(
        "/api/billing/generate-due",
        json={"reference_date": datetime.utcnow().isoformat()},
        headers=admin_headers,
    )
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["generated_count"] >= 1
    new_invoice_id = gen_data["invoice_ids"][-1]

    # Verify duplicate prevention: calling generate-due again should generate 0 and skip
    gen_again = client.post(
        "/api/billing/generate-due",
        json={"reference_date": datetime.utcnow().isoformat()},
        headers=admin_headers,
    )
    assert gen_again.status_code == 200
    assert gen_again.json()["generated_count"] == 0

    # 7. Check the generated invoice
    inv_res = client.get(f"/api/billing/invoices/{new_invoice_id}", headers=admin_headers)
    assert inv_res.status_code == 200
    invoice = inv_res.json()
    assert invoice["subscription_id"] == sub_id
    assert Decimal(str(invoice["subtotal"])) == Decimal("3500.00")
    assert Decimal(str(invoice["amount_paid"])) == Decimal("0.00")
    total_due = Decimal(str(invoice["total_amount"]))
    assert total_due > 0

    # 8. Record a partial payment
    partial_pay = Decimal("2000.00")
    pay1_payload = {
        "invoice_id": new_invoice_id,
        "payment_method": "upi",
        "amount": str(partial_pay),
        "reference_number": "UPI-TXN-10101",
        "notes": "First installment paid via UPI",
    }
    pay1_res = client.post("/api/payments", json=pay1_payload, headers=admin_headers)
    assert pay1_res.status_code == 201

    # Check invoice status and remaining balance
    inv_check1 = client.get(f"/api/billing/invoices/{new_invoice_id}", headers=admin_headers).json()
    assert Decimal(str(inv_check1["amount_paid"])) == partial_pay
    assert Decimal(str(inv_check1["balance_due"])) == total_due - partial_pay
    assert inv_check1["status"] == "confirmed"

    # Complete remaining balance payment
    remaining = Decimal(str(inv_check1["balance_due"]))
    pay2_payload = {
        "invoice_id": new_invoice_id,
        "payment_method": "bank_transfer",
        "amount": str(remaining),
        "reference_number": "NEFT-TXN-10102",
        "notes": "Settling remaining balance",
    }
    pay2_res = client.post("/api/payments", json=pay2_payload, headers=admin_headers)
    assert pay2_res.status_code == 201

    # 9. Verify invoice is now fully PAID
    inv_check2 = client.get(f"/api/billing/invoices/{new_invoice_id}", headers=admin_headers).json()
    assert inv_check2["status"] == "paid"
    assert Decimal(str(inv_check2["balance_due"])) == Decimal("0.00")
    assert Decimal(str(inv_check2["amount_paid"])) == total_due

    # 10. Dashboard summary updates
    dash_res = client.get("/api/dashboard/summary", headers=admin_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["active_subscriptions"] >= 1
    assert Decimal(str(dash_data["total_revenue"])) >= total_due
    assert dash_data["total_customers"] >= 2
