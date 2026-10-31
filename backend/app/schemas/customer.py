from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    create_portal_account: Optional[bool] = True
    password: Optional[str] = "Customer123!"

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    active_subscriptions_count: Optional[int] = 0
    total_invoiced: Optional[float] = 0.0
    outstanding_balance: Optional[float] = 0.0

    class Config:
        from_attributes = True

class CustomerDetailResponse(CustomerResponse):
    subscriptions: List[dict] = []
    invoices: List[dict] = []
