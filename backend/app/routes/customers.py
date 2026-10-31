from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.customer import Customer
from app.models.user import User
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerDetailResponse
from app.services.auth_service import get_current_user, require_roles, hash_password

router = APIRouter(prefix="/customers", tags=["Customers"])

def enrich_customer_response(customer: Customer, db: Session) -> dict:
    active_subs = db.query(Subscription).filter(
        Subscription.customer_id == customer.id,
        Subscription.status == "active"
    ).count()

    invoices = db.query(Invoice).filter(Invoice.customer_id == customer.id).all()
    total_invoiced = sum(inv.total_amount for inv in invoices)
    outstanding = sum(inv.balance_due for inv in invoices)

    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "company": customer.company,
        "address": customer.address,
        "created_at": customer.created_at,
        "active_subscriptions_count": active_subs,
        "total_invoiced": round(total_invoiced, 2),
        "outstanding_balance": round(outstanding, 2)
    }

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "customer":
        if not current_user.customer_id:
            return []
        customers = db.query(Customer).filter(Customer.id == current_user.customer_id).all()
    else:
        customers = db.query(Customer).order_by(Customer.id.desc()).all()

    return [enrich_customer_response(c, db) for c in customers]

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")

    new_customer = Customer(
        name=customer_in.name,
        email=customer_in.email,
        phone=customer_in.phone,
        company=customer_in.company,
        address=customer_in.address
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    if customer_in.create_portal_account:
        user_exists = db.query(User).filter(User.email == customer_in.email).first()
        if not user_exists:
            portal_user = User(
                email=customer_in.email,
                hashed_password=hash_password(customer_in.password or "Customer123!"),
                full_name=customer_in.name,
                role="customer",
                customer_id=new_customer.id,
                is_active=True
            )
            db.add(portal_user)
            db.commit()

    return enrich_customer_response(new_customer, db)

@router.get("/{customer_id}", response_model=CustomerDetailResponse)
def get_customer_detail(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "customer" and current_user.customer_id != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    base_data = enrich_customer_response(customer, db)

    subs = db.query(Subscription).filter(Subscription.customer_id == customer_id).order_by(Subscription.id.desc()).all()
    invs = db.query(Invoice).filter(Invoice.customer_id == customer_id).order_by(Invoice.id.desc()).all()

    subs_list = [
        {
            "id": s.id,
            "subscription_number": s.subscription_number,
            "status": s.status,
            "plan_name": s.plan.name if s.plan else "N/A",
            "amount": s.amount,
            "start_date": str(s.start_date),
            "next_billing_date": str(s.next_billing_date) if s.next_billing_date else None
        }
        for s in subs
    ]

    invs_list = [
        {
            "id": i.id,
            "invoice_number": i.invoice_number,
            "status": i.status,
            "issue_date": str(i.issue_date),
            "due_date": str(i.due_date),
            "total_amount": i.total_amount,
            "amount_paid": i.amount_paid,
            "balance_due": i.balance_due
        }
        for i in invs
    ]

    return {
        **base_data,
        "subscriptions": subs_list,
        "invoices": invs_list
    }

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer_in.name is not None:
        customer.name = customer_in.name
    if customer_in.email is not None:
        customer.email = customer_in.email
    if customer_in.phone is not None:
        customer.phone = customer_in.phone
    if customer_in.company is not None:
        customer.company = customer_in.company
    if customer_in.address is not None:
        customer.address = customer_in.address

    db.commit()
    db.refresh(customer)
    return enrich_customer_response(customer, db)

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}
