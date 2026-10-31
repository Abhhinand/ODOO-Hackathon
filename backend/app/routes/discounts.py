from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.discount import Discount
from app.models.invoice import Invoice
from app.models.user import User
from app.schemas.discount import DiscountCreate, DiscountUpdate, DiscountResponse
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/discounts", tags=["Discounts"])

def enrich_discount(d: Discount, db: Session) -> dict:
    used_cnt = db.query(Invoice).filter(Invoice.discount_id == d.id).count()
    return {
        "id": d.id,
        "code": d.code,
        "description": d.description,
        "discount_type": d.discount_type,
        "value": d.value,
        "is_active": d.is_active,
        "created_at": d.created_at,
        "times_used": used_cnt
    }

@router.get("/", response_model=List[DiscountResponse])
def get_discounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    discounts = db.query(Discount).order_by(Discount.id.desc()).all()
    return [enrich_discount(d, db) for d in discounts]

@router.post("/", response_model=DiscountResponse)
def create_discount(
    disc_in: DiscountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    existing = db.query(Discount).filter(Discount.code == disc_in.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Discount code already exists")

    new_disc = Discount(
        code=disc_in.code.upper().strip(),
        description=disc_in.description,
        discount_type=disc_in.discount_type.lower(),
        value=disc_in.value,
        is_active=disc_in.is_active if disc_in.is_active is not None else True
    )
    db.add(new_disc)
    db.commit()
    db.refresh(new_disc)
    return enrich_discount(new_disc, db)

@router.put("/{discount_id}", response_model=DiscountResponse)
def update_discount(
    discount_id: int,
    disc_in: DiscountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    d = db.query(Discount).filter(Discount.id == discount_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Discount not found")

    if disc_in.code is not None:
        d.code = disc_in.code.upper().strip()
    if disc_in.description is not None:
        d.description = disc_in.description
    if disc_in.discount_type is not None:
        d.discount_type = disc_in.discount_type.lower()
    if disc_in.value is not None:
        d.value = disc_in.value
    if disc_in.is_active is not None:
        d.is_active = disc_in.is_active

    db.commit()
    db.refresh(d)
    return enrich_discount(d, db)

@router.delete("/{discount_id}")
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    d = db.query(Discount).filter(Discount.id == discount_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Discount not found")

    db.delete(d)
    db.commit()
    return {"message": "Discount deleted successfully"}
