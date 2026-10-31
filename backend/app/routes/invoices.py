from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from app.database import get_db
from app.models.invoice import Invoice
from app.models.subscription import Subscription
from app.models.customer import Customer
from app.models.discount import Discount
from app.models.payment import Payment
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceGenerate, InvoiceStatusUpdate, InvoiceResponse, InvoiceDetailResponse
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def generate_inv_number(db: Session) -> str:
    count = db.query(Invoice).count() + 1
    year = date.today().year
    return f"INV-{year}-{count:04d}"

def calculate_invoice_totals(subtotal: float, discount: Optional[Discount], tax_rate: float):
    discount_amount = 0.0
    if discount and discount.is_active:
        if discount.discount_type == "percentage":
            discount_amount = (subtotal * discount.value) / 100.0
        elif discount.discount_type == "fixed":
            discount_amount = min(discount.value, subtotal)
    
    taxable_amount = max(0.0, subtotal - discount_amount)
    tax_amount = taxable_amount * tax_rate
    total_amount = taxable_amount + tax_amount

    return (
        round(discount_amount, 2),
        round(tax_amount, 2),
        round(total_amount, 2)
    )

def enrich_invoice(inv: Invoice) -> dict:
    return {
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "subscription_id": inv.subscription_id,
        "customer_id": inv.customer_id,
        "discount_id": inv.discount_id,
        "status": inv.status,
        "issue_date": inv.issue_date,
        "due_date": inv.due_date,
        "billing_period_start": inv.billing_period_start,
        "billing_period_end": inv.billing_period_end,
        "subtotal": inv.subtotal,
        "discount_amount": inv.discount_amount,
        "tax_rate": inv.tax_rate,
        "tax_amount": inv.tax_amount,
        "total_amount": inv.total_amount,
        "amount_paid": inv.amount_paid,
        "balance_due": inv.balance_due,
        "notes": inv.notes,
        "created_at": inv.created_at,
        "customer_name": inv.customer.name if inv.customer else "N/A",
        "customer_email": inv.customer.email if inv.customer else "N/A",
        "subscription_number": inv.subscription.subscription_number if inv.subscription else None,
        "discount_code": inv.discount.code if inv.discount else None
    }

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "customer":
        if not current_user.customer_id:
            return []
        invoices = db.query(Invoice).filter(Invoice.customer_id == current_user.customer_id).order_by(Invoice.id.desc()).all()
    else:
        invoices = db.query(Invoice).order_by(Invoice.id.desc()).all()

    return [enrich_invoice(inv) for inv in invoices]

@router.post("/generate", response_model=InvoiceResponse)
def generate_invoice_from_subscription(
    gen_req: InvoiceGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    sub = db.query(Subscription).filter(Subscription.id == gen_req.subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    today = date.today()
    period_start = sub.start_date
    interval_days = 365 if sub.plan and sub.plan.billing_interval == "yearly" else 30
    period_end = period_start + timedelta(days=interval_days)

    # Check for duplicate invoice for this subscription and billing period
    existing = db.query(Invoice).filter(
        Invoice.subscription_id == sub.id,
        Invoice.billing_period_start == period_start,
        Invoice.billing_period_end == period_end
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An invoice ({existing.invoice_number}) has already been generated for this billing period ({period_start} to {period_end})."
        )

    # Calculate amounts
    discount = None
    if gen_req.discount_id:
        discount = db.query(Discount).filter(Discount.id == gen_req.discount_id).first()

    tax_rate = gen_req.tax_rate if gen_req.tax_rate is not None else 0.10
    disc_amt, tax_amt, total_amt = calculate_invoice_totals(sub.amount, discount, tax_rate)

    inv_num = generate_inv_number(db)
    while db.query(Invoice).filter(Invoice.invoice_number == inv_num).first():
        cnt = int(inv_num.split("-")[-1]) + 1
        inv_num = f"INV-{today.year}-{cnt:04d}"

    due_days = gen_req.due_days or 14
    due_date = today + timedelta(days=due_days)

    new_invoice = Invoice(
        invoice_number=inv_num,
        subscription_id=sub.id,
        customer_id=sub.customer_id,
        discount_id=gen_req.discount_id,
        status="confirmed",
        issue_date=today,
        due_date=due_date,
        billing_period_start=period_start,
        billing_period_end=period_end,
        subtotal=sub.amount,
        discount_amount=disc_amt,
        tax_rate=tax_rate,
        tax_amount=tax_amt,
        total_amount=total_amt,
        amount_paid=0.0,
        balance_due=total_amt,
        notes=gen_req.notes or f"Generated for subscription {sub.subscription_number}"
    )

    # Advance next billing date on subscription
    sub.next_billing_date = period_end
    if sub.status == "draft":
        sub.status = "confirmed"

    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return enrich_invoice(new_invoice)

@router.post("/", response_model=InvoiceResponse)
def create_manual_invoice(
    inv_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    cust = db.query(Customer).filter(Customer.id == inv_in.customer_id).first()
    if not cust:
        raise HTTPException(status_code=400, detail="Customer not found")

    discount = None
    if inv_in.discount_id:
        discount = db.query(Discount).filter(Discount.id == inv_in.discount_id).first()

    tax_rate = inv_in.tax_rate if inv_in.tax_rate is not None else 0.10
    disc_amt, tax_amt, total_amt = calculate_invoice_totals(inv_in.subtotal, discount, tax_rate)

    today = date.today()
    inv_num = generate_inv_number(db)
    while db.query(Invoice).filter(Invoice.invoice_number == inv_num).first():
        cnt = int(inv_num.split("-")[-1]) + 1
        inv_num = f"INV-{today.year}-{cnt:04d}"

    new_inv = Invoice(
        invoice_number=inv_num,
        subscription_id=inv_in.subscription_id,
        customer_id=inv_in.customer_id,
        discount_id=inv_in.discount_id,
        status="draft",
        issue_date=inv_in.issue_date or today,
        due_date=inv_in.due_date,
        billing_period_start=inv_in.billing_period_start,
        billing_period_end=inv_in.billing_period_end,
        subtotal=inv_in.subtotal,
        discount_amount=disc_amt,
        tax_rate=tax_rate,
        tax_amount=tax_amt,
        total_amount=total_amt,
        amount_paid=0.0,
        balance_due=total_amt,
        notes=inv_in.notes
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)
    return enrich_invoice(new_inv)

@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
def get_invoice_detail(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if current_user.role == "customer" and inv.customer_id != current_user.customer_id:
        raise HTTPException(status_code=403, detail="Access denied")

    base = enrich_invoice(inv)

    payments = db.query(Payment).filter(Payment.invoice_id == inv.id).order_by(Payment.id.desc()).all()
    pay_list = [
        {
            "id": p.id,
            "payment_number": p.payment_number,
            "amount": p.amount,
            "payment_date": str(p.payment_date),
            "payment_method": p.payment_method,
            "reference": p.reference
        }
        for p in payments
    ]

    return {
        **base,
        "customer": {
            "id": inv.customer.id,
            "name": inv.customer.name,
            "email": inv.customer.email,
            "company": inv.customer.company,
            "phone": inv.customer.phone,
            "address": inv.customer.address
        } if inv.customer else None,
        "subscription": {
            "id": inv.subscription.id,
            "subscription_number": inv.subscription.subscription_number,
            "plan_name": inv.subscription.plan.name if inv.subscription and inv.subscription.plan else None
        } if inv.subscription else None,
        "discount": {
            "id": inv.discount.id,
            "code": inv.discount.code,
            "discount_type": inv.discount.discount_type,
            "value": inv.discount.value
        } if inv.discount else None,
        "payments": pay_list
    }

@router.put("/{invoice_id}/status", response_model=InvoiceResponse)
def update_invoice_status(
    invoice_id: int,
    status_update: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    allowed = ["draft", "confirmed", "paid"]
    new_status = status_update.status.lower()
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv.status = new_status
    if new_status == "paid":
        inv.amount_paid = inv.total_amount
        inv.balance_due = 0.0

    db.commit()
    db.refresh(inv)
    return enrich_invoice(inv)

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    db.delete(inv)
    db.commit()
    return {"message": "Invoice deleted successfully"}
