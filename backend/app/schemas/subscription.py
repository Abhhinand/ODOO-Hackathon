from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class SubscriptionBase(BaseModel):
    customer_id: int
    plan_id: int
    start_date: Optional[date] = None
    amount: Optional[float] = None  # if not provided, inherits from plan price
    notes: Optional[str] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionStatusUpdate(BaseModel):
    status: str  # draft, confirmed, active, closed
    notes: Optional[str] = None

class SubscriptionResponse(BaseModel):
    id: int
    subscription_number: str
    customer_id: int
    plan_id: int
    status: str
    start_date: date
    next_billing_date: Optional[date] = None
    amount: float
    notes: Optional[str] = None
    created_at: datetime
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: Optional[str] = None
    billing_interval: Optional[str] = None
    invoices_count: Optional[int] = 0

    class Config:
        from_attributes = True

class SubscriptionDetailResponse(SubscriptionResponse):
    customer: Optional[dict] = None
    plan: Optional[dict] = None
    invoices: List[dict] = []
