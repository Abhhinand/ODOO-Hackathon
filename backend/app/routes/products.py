from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.product import Product
from app.models.plan import Plan
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/products", tags=["Products"])

def enrich_product(p: Product, db: Session) -> dict:
    plans_cnt = db.query(Plan).filter(Plan.product_id == p.id).count()
    return {
        "id": p.id,
        "name": p.name,
        "type": p.type,
        "sales_price": p.sales_price,
        "cost_price": p.cost_price,
        "notes": p.notes,
        "is_active": p.is_active,
        "created_at": p.created_at,
        "plans_count": plans_cnt
    }

@router.get("/", response_model=List[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    products = db.query(Product).order_by(Product.id.desc()).all()
    return [enrich_product(p, db) for p in products]

@router.post("/", response_model=ProductResponse)
def create_product(
    prod_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    new_prod = Product(
        name=prod_in.name,
        type=prod_in.type or "Service",
        sales_price=prod_in.sales_price,
        cost_price=prod_in.cost_price,
        notes=prod_in.notes,
        is_active=prod_in.is_active if prod_in.is_active is not None else True
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    return enrich_product(new_prod, db)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return enrich_product(p, db)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    prod_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "staff"]))
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    if prod_in.name is not None:
        p.name = prod_in.name
    if prod_in.type is not None:
        p.type = prod_in.type
    if prod_in.sales_price is not None:
        p.sales_price = prod_in.sales_price
    if prod_in.cost_price is not None:
        p.cost_price = prod_in.cost_price
    if prod_in.notes is not None:
        p.notes = prod_in.notes
    if prod_in.is_active is not None:
        p.is_active = prod_in.is_active

    db.commit()
    db.refresh(p)
    return enrich_product(p, db)

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(p)
    db.commit()
    return {"message": "Product deleted successfully"}
