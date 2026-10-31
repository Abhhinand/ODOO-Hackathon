from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PlanBase(BaseModel):
    product_id: int
    name: str
    billing_interval: str = "monthly"  # monthly, yearly
    price: float
    description: Optional[str] = None
    is_active: Optional[bool] = True

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    product_id: Optional[int] = None
    name: Optional[str] = None
    billing_interval: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PlanResponse(PlanBase):
    id: int
    created_at: datetime
    product_name: Optional[str] = None
    active_subscriptions_count: Optional[int] = 0

    class Config:
        from_attributes = True
