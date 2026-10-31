from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.plan import Plan
from app.models.product import Product
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/plans", tags=["Plans"])

def enrich_plan(p: Plan, db: Session) -> dict:
    active_subs = db.query(Subscription).filter(
        Subscription.plan_id == p.id,
        Subscription.status == "active"
    ).count()

    return {
        "id": p.id,
        "product_id": p.product_id,
        "name": p.name,
        "billing_interval": p.billing_interval,
        "price": p.price,
        "description": p.description,
        "is_active": p.is_active,
        "created_at": p.created_at,
        "product_name": p.product.name if p.product else "N/A",
        "active_subscriptions_count": active_subs
    }

@router.get("/", response_model=List[PlanResponse])
def get_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plans = db.query(Plan).order_by(Plan.id.desc()).all()
    return [enrich_plan(p, db) for p in plans]

@router.post("/", response_model=PlanResponse)
def create_plan(
    plan_in: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    prod = db.query(Product).filter(Product.id == plan_in.product_id).first()
    if not prod:
        raise HTTPException(status_code=400, detail="Associated product not found")

    new_plan = Plan(
        product_id=plan_in.product_id,
        name=plan_in.name,
        billing_interval=plan_in.billing_interval.lower(),
        price=plan_in.price,
        description=plan_in.description,
        is_active=plan_in.is_active if plan_in.is_active is not None else True
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return enrich_plan(new_plan, db)

@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Plan).filter(Plan.id == plan_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    return enrich_plan(p, db)

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int,
    plan_in: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    p = db.query(Plan).filter(Plan.id == plan_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")

    if plan_in.product_id is not None:
        p.product_id = plan_in.product_id
    if plan_in.name is not None:
        p.name = plan_in.name
    if plan_in.billing_interval is not None:
        p.billing_interval = plan_in.billing_interval.lower()
    if plan_in.price is not None:
        p.price = plan_in.price
    if plan_in.description is not None:
        p.description = plan_in.description
    if plan_in.is_active is not None:
        p.is_active = plan_in.is_active

    db.commit()
    db.refresh(p)
    return enrich_plan(p, db)

@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    p = db.query(Plan).filter(Plan.id == plan_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")

    db.delete(p)
    db.commit()
    return {"message": "Plan deleted successfully"}
