from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models.subscription import Subscription
from app.models.customer import Customer
from app.models.plan import Plan
from app.models.invoice import Invoice
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionStatusUpdate, SubscriptionResponse, SubscriptionDetailResponse
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

def generate_sub_number(db: Session) -> str:
    count = db.query(Subscription).count() + 1
    year = date.today().year
    return f"SUB-{year}-{count:04d}"

def enrich_subscription(s: Subscription, db: Session) -> dict:
    inv_count = db.query(Invoice).filter(Invoice.subscription_id == s.id).count()
    return {
        "id": s.id,
        "subscription_number": s.subscription_number,
        "customer_id": s.customer_id,
        "plan_id": s.plan_id,
        "status": s.status,
        "start_date": s.start_date,
        "next_billing_date": s.next_billing_date,
        "amount": s.amount,
        "notes": s.notes,
        "created_at": s.created_at,
        "customer_name": s.customer.name if s.customer else "N/A",
        "customer_email": s.customer.email if s.customer else "N/A",
        "plan_name": s.plan.name if s.plan else "N/A",
        "billing_interval": s.plan.billing_interval if s.plan else "N/A",
        "invoices_count": inv_count
    }

@router.get("/", response_model=List[SubscriptionResponse])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "customer":
        if not current_user.customer_id:
            return []
        subs = db.query(Subscription).filter(Subscription.customer_id == current_user.customer_id).order_by(Subscription.id.desc()).all()
    else:
        subs = db.query(Subscription).order_by(Subscription.id.desc()).all()

    return [enrich_subscription(s, db) for s in subs]

@router.post("/", response_model=SubscriptionResponse)
def create_subscription(
    sub_in: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    customer = db.query(Customer).filter(Customer.id == sub_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")

    plan = db.query(Plan).filter(Plan.id == sub_in.plan_id).first()
    if not plan:
        raise HTTPException(status_code=400, detail="Plan not found")

    start = sub_in.start_date or date.today()
    interval_days = 365 if plan.billing_interval == "yearly" else 30
    next_bill = start + timedelta(days=interval_days)
    amount = sub_in.amount if sub_in.amount is not None else plan.price

    # Generate unique sub number
    sub_num = generate_sub_number(db)
    while db.query(Subscription).filter(Subscription.subscription_number == sub_num).first():
        count = int(sub_num.split("-")[-1]) + 1
        sub_num = f"SUB-{start.year}-{count:04d}"

    new_sub = Subscription(
        subscription_number=sub_num,
        customer_id=sub_in.customer_id,
        plan_id=sub_in.plan_id,
        status="draft",
        start_date=start,
        next_billing_date=next_bill,
        amount=amount,
        notes=sub_in.notes
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return enrich_subscription(new_sub, db)

@router.get("/{subscription_id}", response_model=SubscriptionDetailResponse)
def get_subscription_detail(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if current_user.role == "customer" and sub.customer_id != current_user.customer_id:
        raise HTTPException(status_code=403, detail="Access denied")

    base = enrich_subscription(sub, db)

    invoices = db.query(Invoice).filter(Invoice.subscription_id == sub.id).order_by(Invoice.id.desc()).all()
    invoices_list = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "status": inv.status,
            "issue_date": str(inv.issue_date),
            "due_date": str(inv.due_date),
            "total_amount": inv.total_amount,
            "amount_paid": inv.amount_paid,
            "balance_due": inv.balance_due
        }
        for inv in invoices
    ]

    return {
        **base,
        "customer": {
            "id": sub.customer.id,
            "name": sub.customer.name,
            "email": sub.customer.email,
            "company": sub.customer.company
        } if sub.customer else None,
        "plan": {
            "id": sub.plan.id,
            "name": sub.plan.name,
            "billing_interval": sub.plan.billing_interval,
            "price": sub.plan.price
        } if sub.plan else None,
        "invoices": invoices_list
    }

@router.put("/{subscription_id}/status", response_model=SubscriptionResponse)
def update_subscription_status(
    subscription_id: int,
    status_update: SubscriptionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    allowed_statuses = ["draft", "confirmed", "active", "closed"]
    new_status = status_update.status.lower()
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed_statuses}")

    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.status = new_status
    if status_update.notes:
        sub.notes = (sub.notes or "") + f"\n[{date.today()}] {status_update.notes}"

    db.commit()
    db.refresh(sub)
    return enrich_subscription(sub, db)

@router.delete("/{subscription_id}")
def delete_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    db.delete(sub)
    db.commit()
    return {"message": "Subscription deleted successfully"}
