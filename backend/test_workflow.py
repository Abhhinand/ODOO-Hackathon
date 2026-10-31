import sys
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.services.seed_service import seed_database
from app.models import User, Customer, Product, Plan, Subscription, Invoice, Payment

def test_full_workflow():
    print("========================================")
    print("STARTING BRIGHTLOOP END-TO-END WORKFLOW")
    print("========================================")

    # 1. Initialize schema & seed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()

    client = TestClient(app)

    # 2. Authenticate as Admin
    print("\n[Step 1] Authenticating as Administrator...")
    login_res = client.post("/api/auth/login", json={
        "email": "admin@brightloop.com",
        "password": "admin123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(" -> Admin authenticated successfully.")

    # 3. Retrieve Dashboard Summary
    print("\n[Step 2] Retrieving Executive Dashboard Summary...")
    dash_res = client.get("/api/dashboard/summary", headers=admin_headers)
    assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
    dash_data = dash_res.json()
    print(f" -> Active Subscriptions: {dash_data['summary']['active_subscriptions']}")
    print(f" -> MRR: ${dash_data['summary']['mrr']:.2f}")
    print(f" -> Collected This Month: ${dash_data['summary']['collected_this_month']:.2f}")
    print(f" -> Outstanding Amount: ${dash_data['summary']['outstanding_amount']:.2f}")
    print(f" -> Revenue Pulse Points: {len(dash_data['revenue_pulse'])}")
    print(f" -> Needs Attention Items: {len(dash_data['needs_attention'])}")

    # 4. Create Product
    print("\n[Step 3] Creating new Product 'Cyber Shield Sentinel'...")
    prod_res = client.post("/api/products/", headers=admin_headers, json={
        "name": "Cyber Shield Sentinel",
        "type": "Software",
        "sales_price": 299.00,
        "cost_price": 45.00,
        "notes": "Automated security orchestration and intrusion detection.",
        "is_active": True
    })
    assert prod_res.status_code == 200, f"Product create failed: {prod_res.text}"
    prod_id = prod_res.json()["id"]
    print(f" -> Product created with ID: {prod_id}")

    # 5. Create Subscription Plan
    print("\n[Step 4] Creating Subscription Plan 'Sentinel Monthly'...")
    plan_res = client.post("/api/plans/", headers=admin_headers, json={
        "product_id": prod_id,
        "name": "Sentinel Monthly Plan",
        "billing_interval": "monthly",
        "price": 299.00,
        "description": "Standard recurring enterprise protection.",
        "is_active": True
    })
    assert plan_res.status_code == 200, f"Plan create failed: {plan_res.text}"
    plan_id = plan_res.json()["id"]
    print(f" -> Plan created with ID: {plan_id}")

    # 6. Register Customer
    print("\n[Step 5] Registering Customer 'Apex Robotics Inc'...")
    cust_res = client.post("/api/customers/", headers=admin_headers, json={
        "name": "Apex Robotics Inc",
        "email": "contact@apexrobotics.io",
        "phone": "+1 (555) 789-0123",
        "company": "Apex Dynamics Group",
        "address": "500 Tech Parkway, Suite 100, Seattle, WA",
        "create_portal_account": True,
        "password": "Customer123!"
    })
    assert cust_res.status_code == 200, f"Customer create failed: {cust_res.text}"
    cust_id = cust_res.json()["id"]
    print(f" -> Customer created with ID: {cust_id} (Portal account generated)")

    # 7. Create Subscription
    print("\n[Step 6] Creating Subscription for Customer...")
    sub_res = client.post("/api/subscriptions/", headers=admin_headers, json={
        "customer_id": cust_id,
        "plan_id": plan_id,
        "start_date": "2026-10-31",
        "amount": 299.00,
        "notes": "Hackathon validation subscription contract."
    })
    assert sub_res.status_code == 200, f"Subscription create failed: {sub_res.text}"
    sub_id = sub_res.json()["id"]
    sub_number = sub_res.json()["subscription_number"]
    assert sub_res.json()["status"] == "draft"
    print(f" -> Subscription {sub_number} created in 'draft' status.")

    # 8. Subscription Lifecycle: Draft -> Confirmed -> Active
    print("\n[Step 7] Testing Subscription Lifecycle Status Changes...")
    status_res1 = client.put(f"/api/subscriptions/{sub_id}/status", headers=admin_headers, json={"status": "confirmed"})
    assert status_res1.json()["status"] == "confirmed"
    print(" -> Subscription confirmed.")

    status_res2 = client.put(f"/api/subscriptions/{sub_id}/status", headers=admin_headers, json={"status": "active"})
    assert status_res2.json()["status"] == "active"
    print(" -> Subscription activated.")

    # 9. Generate Invoice with Tax & Discount
    print("\n[Step 8] Generating Invoice from Subscription...")
    inv_gen_res = client.post("/api/invoices/generate", headers=admin_headers, json={
        "subscription_id": sub_id,
        "due_days": 14,
        "tax_rate": 0.10,
        "notes": f"Initial cycle billing for {sub_number}"
    })
    assert inv_gen_res.status_code == 200, f"Invoice generation failed: {inv_gen_res.text}"
    inv_data = inv_gen_res.json()
    inv_id = inv_data["id"]
    inv_num = inv_data["invoice_number"]
    total = inv_data["total_amount"]
    balance = inv_data["balance_due"]
    print(f" -> Invoice {inv_num} generated: Subtotal=${inv_data['subtotal']:.2f}, Tax=${inv_data['tax_amount']:.2f}, Total=${total:.2f}, Balance=${balance:.2f}")

    # 10. Test Duplicate Prevention
    print("\n[Step 9] Testing Duplicate Invoice Generation Prevention...")
    dup_res = client.post("/api/invoices/generate", headers=admin_headers, json={
        "subscription_id": sub_id,
        "due_days": 14
    })
    assert dup_res.status_code == 400, "Duplicate invoice generation was NOT blocked!"
    print(f" -> Duplicate check successfully blocked: {dup_res.json()['detail']}")

    # 11. Record Payment
    print(f"\n[Step 10] Recording Payment of ${total:.2f} for Invoice {inv_num}...")
    pay_res = client.post("/api/payments/", headers=admin_headers, json={
        "invoice_id": inv_id,
        "amount": total,
        "payment_method": "Credit Card",
        "reference": "tx_demo_settlement_99881",
        "notes": "Full settlement clearance"
    })
    assert pay_res.status_code == 200, f"Payment recording failed: {pay_res.text}"
    pay_num = pay_res.json()["payment_number"]
    print(f" -> Payment {pay_num} recorded.")

    # Verify invoice status flipped to 'paid'
    check_inv = client.get(f"/api/invoices/{inv_id}", headers=admin_headers).json()
    assert check_inv["status"] == "paid"
    assert check_inv["balance_due"] == 0.0
    print(f" -> Invoice {inv_num} status verified: PAID (Balance Due: $0.00)")

    # 12. Test Customer Portal Access Isolation
    print("\n[Step 11] Testing Customer Portal Login & Isolation...")
    cust_login = client.post("/api/auth/login", json={
        "email": "contact@apexrobotics.io",
        "password": "Customer123!"
    })
    assert cust_login.status_code == 200, f"Customer login failed: {cust_login.text}"
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Customer should only see their own invoices
    cust_invoices = client.get("/api/invoices/", headers=cust_headers).json()
    for ci in cust_invoices:
        assert ci["customer_id"] == cust_id, "Data leak! Customer saw another customer's invoice!"
    print(f" -> Customer Portal verified: Customer saw only their {len(cust_invoices)} invoice(s), isolated from others.")

    print("\n==================================================")
    print(" ALL 11 TESTS & LIFECYCLE WORKFLOWS PASSED 100%! ")
    print("==================================================")

if __name__ == "__main__":
    test_full_workflow()
