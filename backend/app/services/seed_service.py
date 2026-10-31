from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models import User, Customer, Product, Plan, Discount, Subscription, Invoice, Payment
from app.services.auth_service import hash_password

def seed_database(db: Session):
    # Check if admin already exists
    if db.query(User).filter(User.email == "admin@brightloop.com").first():
        return

    # 1. Create Admin & Staff Users
    admin_user = User(
        email="admin@brightloop.com",
        hashed_password=hash_password("admin123"),
        full_name="Alex Rivera (Admin)",
        role="admin",
        is_active=True
    )
    staff_user = User(
        email="staff@brightloop.com",
        hashed_password=hash_password("staff123"),
        full_name="Morgan Chen (Staff)",
        role="staff",
        is_active=True
    )
    db.add(admin_user)
    db.add(staff_user)
    db.commit()

    # 2. Create Customers
    customer_acme = Customer(
        name="Acme Cloud Corp",
        email="acme@brightloop.com",
        phone="+1 (555) 234-5678",
        company="Acme Corporation",
        address="100 Innovation Blvd, Suite 400, San Francisco, CA"
    )
    customer_vortex = Customer(
        name="Vortex Dynamics",
        email="vortex@brightloop.com",
        phone="+1 (555) 876-5432",
        company="Vortex Dynamics Inc.",
        address="42 Cybernetic Way, Austin, TX"
    )
    customer_helios = Customer(
        name="Helios Labs",
        email="helios@brightloop.com",
        phone="+1 (555) 345-9876",
        company="Helios BioLabs",
        address="78 Beacon St, Boston, MA"
    )
    db.add_all([customer_acme, customer_vortex, customer_helios])
    db.commit()

    # Create Customer User Portal login for Acme
    customer_user = User(
        email="acme@brightloop.com",
        hashed_password=hash_password("customer123"),
        full_name="Sarah Connor (Acme)",
        role="customer",
        customer_id=customer_acme.id,
        is_active=True
    )
    db.add(customer_user)
    db.commit()

    # 3. Create Products
    prod_analytics = Product(
        name="Cloud Analytics Pro",
        type="Software",
        sales_price=149.00,
        cost_price=25.00,
        notes="High-throughput cloud data analytics and ingestion pipeline."
    )
    prod_retainer = Product(
        name="Enterprise Support Retainer",
        type="Service",
        sales_price=499.00,
        cost_price=120.00,
        notes="Dedicated 24/7 technical architect on call with 15-minute SLA."
    )
    prod_api = Product(
        name="API Access Tier",
        type="Digital",
        sales_price=79.00,
        cost_price=10.00,
        notes="Unlimited API endpoints and webhook delivery."
    )
    db.add_all([prod_analytics, prod_retainer, prod_api])
    db.commit()

    # 4. Create Plans
    plan_analytics_m = Plan(
        product_id=prod_analytics.id,
        name="Cloud Analytics Pro - Monthly",
        billing_interval="monthly",
        price=149.00,
        description="Billed monthly. Unlimited pipelines and dashboards."
    )
    plan_analytics_y = Plan(
        product_id=prod_analytics.id,
        name="Cloud Analytics Pro - Annual",
        billing_interval="yearly",
        price=1490.00,
        description="Billed annually with 2 months free."
    )
    plan_retainer_m = Plan(
        product_id=prod_retainer.id,
        name="Enterprise Retainer - Monthly",
        billing_interval="monthly",
        price=499.00,
        description="Priority SLA support."
    )
    plan_api_m = Plan(
        product_id=prod_api.id,
        name="API Access Tier - Monthly",
        billing_interval="monthly",
        price=79.00,
        description="100k requests/minute."
    )
    db.add_all([plan_analytics_m, plan_analytics_y, plan_retainer_m, plan_api_m])
    db.commit()

    # 5. Create Discounts
    disc_launch = Discount(
        code="LAUNCH20",
        description="Launch celebration 20% off",
        discount_type="percentage",
        value=20.0,
        is_active=True
    )
    disc_founder = Discount(
        code="FOUNDER50",
        description="Founder fixed $50 credit",
        discount_type="fixed",
        value=50.0,
        is_active=True
    )
    db.add_all([disc_launch, disc_founder])
    db.commit()

    # 6. Create Subscriptions
    sub1 = Subscription(
        subscription_number="SUB-2026-0001",
        customer_id=customer_acme.id,
        plan_id=plan_analytics_m.id,
        status="active",
        start_date=date.today() - timedelta(days=45),
        next_billing_date=date.today() + timedelta(days=15),
        amount=149.00,
        notes="Primary analytics production subscription."
    )
    sub2 = Subscription(
        subscription_number="SUB-2026-0002",
        customer_id=customer_vortex.id,
        plan_id=plan_retainer_m.id,
        status="active",
        start_date=date.today() - timedelta(days=20),
        next_billing_date=date.today() + timedelta(days=10),
        amount=499.00,
        notes="Enterprise support package."
    )
    sub3 = Subscription(
        subscription_number="SUB-2026-0003",
        customer_id=customer_helios.id,
        plan_id=plan_api_m.id,
        status="confirmed",
        start_date=date.today(),
        next_billing_date=date.today() + timedelta(days=30),
        amount=79.00,
        notes="Pending onboarding setup."
    )
    db.add_all([sub1, sub2, sub3])
    db.commit()

    # 7. Create Invoices
    # Inv 1: Acme - Paid
    subtotal1 = 149.00
    disc_val1 = subtotal1 * 0.20 # $29.80
    tax1 = (subtotal1 - disc_val1) * 0.10 # $11.92
    tot1 = round(subtotal1 - disc_val1 + tax1, 2) # $131.12
    inv1 = Invoice(
        invoice_number="INV-2026-0001",
        subscription_id=sub1.id,
        customer_id=customer_acme.id,
        discount_id=disc_launch.id,
        status="paid",
        issue_date=date.today() - timedelta(days=45),
        due_date=date.today() - timedelta(days=31),
        billing_period_start=date.today() - timedelta(days=45),
        billing_period_end=date.today() - timedelta(days=15),
        subtotal=subtotal1,
        discount_amount=round(disc_val1, 2),
        tax_rate=0.10,
        tax_amount=round(tax1, 2),
        total_amount=tot1,
        amount_paid=tot1,
        balance_due=0.0,
        notes="First month subscription invoice."
    )

    # Inv 2: Vortex - Confirmed (Pending payment)
    subtotal2 = 499.00
    tax2 = subtotal2 * 0.10 # $49.90
    tot2 = round(subtotal2 + tax2, 2) # $548.90
    inv2 = Invoice(
        invoice_number="INV-2026-0002",
        subscription_id=sub2.id,
        customer_id=customer_vortex.id,
        status="confirmed",
        issue_date=date.today() - timedelta(days=5),
        due_date=date.today() + timedelta(days=9),
        billing_period_start=date.today() - timedelta(days=5),
        billing_period_end=date.today() + timedelta(days=25),
        subtotal=subtotal2,
        discount_amount=0.0,
        tax_rate=0.10,
        tax_amount=round(tax2, 2),
        total_amount=tot2,
        amount_paid=0.0,
        balance_due=tot2,
        notes="Monthly retainer invoice."
    )

    # Inv 3: Overdue demo invoice
    subtotal3 = 149.00
    tax3 = subtotal3 * 0.10
    tot3 = round(subtotal3 + tax3, 2)
    inv3 = Invoice(
        invoice_number="INV-2026-0003",
        subscription_id=sub1.id,
        customer_id=customer_acme.id,
        status="confirmed",
        issue_date=date.today() - timedelta(days=20),
        due_date=date.today() - timedelta(days=5), # Overdue!
        billing_period_start=date.today() - timedelta(days=15),
        billing_period_end=date.today() + timedelta(days=15),
        subtotal=subtotal3,
        discount_amount=0.0,
        tax_rate=0.10,
        tax_amount=round(tax3, 2),
        total_amount=tot3,
        amount_paid=0.0,
        balance_due=tot3,
        notes="Renewal invoice (Overdue demo)."
    )

    db.add_all([inv1, inv2, inv3])
    db.commit()

    # 8. Create Payment for Inv 1
    pay1 = Payment(
        payment_number="PAY-2026-0001",
        invoice_id=inv1.id,
        amount=tot1,
        payment_date=date.today() - timedelta(days=44),
        payment_method="Credit Card",
        reference="ch_stripe_demo_89324823",
        notes="Automated card clearance."
    )
    db.add(pay1)
    db.commit()
