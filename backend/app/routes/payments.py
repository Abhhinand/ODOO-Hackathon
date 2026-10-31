from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/payments", tags=["Payments"])

def generate_pay_number(db: Session) -> str:
    count = db.query(Payment).count() + 1
    year = date.today().year
    return f"PAY-{year}-{count:04d}"

def enrich_payment(p: Payment) -> dict:
    return {
        "id": p.id,
        "payment_number": p.payment_number,
        "invoice_id": p.invoice_id,
        "amount": p.amount,
        "payment_date": p.payment_date,
        "payment_method": p.payment_method,
        "reference": p.reference,
        "notes": p.notes,
        "created_at": p.created_at,
        "invoice_number": p.invoice.invoice_number if p.invoice else "N/A",
        "customer_name": p.invoice.customer.name if p.invoice and p.invoice.customer else "N/A"
    }

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "customer":
        if not current_user.customer_id:
            return []
        payments = (
            db.query(Payment)
            .join(Invoice)
            .filter(Invoice.customer_id == current_user.customer_id)
            .order_by(Payment.id.desc())
            .all()
        )
    else:
        payments = db.query(Payment).order_by(Payment.id.desc()).all()

    return [enrich_payment(p) for p in payments]

@router.post("/", response_model=PaymentResponse)
def record_payment(
    pay_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    inv = db.query(Invoice).filter(Invoice.id == pay_in.invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if pay_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    if pay_in.amount > inv.balance_due + 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (${pay_in.amount:.2f}) exceeds outstanding balance (${inv.balance_due:.2f})"
        )

    today = date.today()
    pay_num = generate_pay_number(db)
    while db.query(Payment).filter(Payment.payment_number == pay_num).first():
        cnt = int(pay_num.split("-")[-1]) + 1
        pay_num = f"PAY-{today.year}-{cnt:04d}"

    payment = Payment(
        payment_number=pay_num,
        invoice_id=inv.id,
        amount=round(pay_in.amount, 2),
        payment_date=pay_in.payment_date or today,
        payment_method=pay_in.payment_method,
        reference=pay_in.reference,
        notes=pay_in.notes
    )

    # Update invoice balances
    new_amount_paid = round(inv.amount_paid + pay_in.amount, 2)
    new_balance = round(max(0.0, inv.total_amount - new_amount_paid), 2)
    inv.amount_paid = new_amount_paid
    inv.balance_due = new_balance

    if new_balance <= 0.01:
        inv.status = "paid"
        inv.balance_due = 0.0

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return enrich_payment(payment)

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")

    if current_user.role == "customer" and (not p.invoice or p.invoice.customer_id != current_user.customer_id):
        raise HTTPException(status_code=403, detail="Access denied")

    return enrich_payment(p)
