from datetime import date
from decimal import Decimal
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.finance import Invoice, InvoiceStatus

def test_api_dashboard_and_billing_workflow(client, db_session, sample_customer, sample_plan):
    today = date.today()

    # 1. Create active subscription
    sub = Subscription(
        subscription_number="SUB-API-001",
        customer_id=sample_customer.id,
        plan_id=sample_plan.id,
        status=SubscriptionStatus.ACTIVE,
        start_date=today,
        next_billing_date=today,
        payment_terms="Due on receipt",
        quantity=1,
        unit_price=Decimal("2000.00"),
        tax_rate=Decimal("18.00"),
        total_amount=Decimal("2000.00")
    )
    db_session.add(sub)
    db_session.commit()

    # 2. Trigger automatic invoice generation via API
    gen_res = client.post("/api/billing/generate-due", json={"as_of_date": str(today)})
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["generated_count"] == 1
    assert len(gen_data["generated_invoices"]) == 1
    inv_id = gen_data["generated_invoices"][0]["id"]
    total_amt = gen_data["generated_invoices"][0]["total_amount"]
    assert float(total_amt) == 2360.0  # 2000 + 18% tax

    # 3. List invoices
    inv_list_res = client.get("/api/invoices")
    assert inv_list_res.status_code == 200
    assert len(inv_list_res.json()) >= 1

    # 4. Get invoice details
    inv_detail_res = client.get(f"/api/invoices/{inv_id}")
    assert inv_detail_res.status_code == 200
    assert inv_detail_res.json()["invoice_number"].startswith("INV-")

    # 5. Record partial payment via API
    pay_res = client.post("/api/payments", json={
        "invoice_id": inv_id,
        "amount": "1000.00",
        "payment_method": "upi",
        "notes": "First installment"
    })
    assert pay_res.status_code == 201
    pay_data = pay_res.json()
    assert pay_data["payment_number"].startswith("PAY-")

    # 6. Check updated invoice balance
    updated_inv_res = client.get(f"/api/invoices/{inv_id}")
    inv_updated = updated_inv_res.json()
    assert float(inv_updated["amount_paid"]) == 1000.0
    assert float(inv_updated["outstanding_amount"]) == 1360.0
    assert inv_updated["status"] == "partially_paid"

    # 7. Settle remaining balance
    pay_res2 = client.post("/api/payments", json={
        "invoice_id": inv_id,
        "amount": "1360.00",
        "payment_method": "bank_transfer"
    })
    assert pay_res2.status_code == 201

    settled_inv_res = client.get(f"/api/invoices/{inv_id}")
    inv_settled = settled_inv_res.json()
    assert float(inv_settled["amount_paid"]) == 2360.0
    assert float(inv_settled["outstanding_amount"]) == 0.0
    assert inv_settled["status"] == "paid"

    # 8. Check Dashboard Summary
    dash_res = client.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_active_subscriptions"] == 1
    assert float(dash_data["total_revenue"]) == 2360.0
    assert float(dash_data["total_outstanding"]) == 0.0

    # 9. Check Revenue Trend API
    rev_res = client.get("/api/dashboard/revenue?period=daily")
    assert rev_res.status_code == 200
    assert len(rev_res.json()["trends"]) >= 1

def test_api_discount_crud_and_validation(client):
    # Create discount
    create_res = client.post("/api/discounts", json={
        "code": "PROMO20",
        "name": "20% Promotional Discount",
        "discount_type": "percentage",
        "discount_value": "20.00",
        "min_purchase_amount": "500.00",
        "min_quantity": 1,
        "is_active": True
    })
    assert create_res.status_code == 201
    disc_id = create_res.json()["id"]

    # Validate discount
    val_res = client.post("/api/discounts/validate", json={
        "code": "PROMO20",
        "subtotal": "1000.00",
        "quantity": 1
    })
    assert val_res.status_code == 200
    assert val_res.json()["valid"] is True
    assert float(val_res.json()["discount_amount"]) == 200.0  # 20% of 1000

    # List discounts
    list_res = client.get("/api/discounts")
    assert list_res.status_code == 200
    assert any(d["code"] == "PROMO20" for d in list_res.json())
