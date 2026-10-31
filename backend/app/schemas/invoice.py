from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class InvoiceBase(BaseModel):
    customer_id: int
    subscription_id: Optional[int] = None
    discount_id: Optional[int] = None
    issue_date: Optional[date] = None
    due_date: date
    billing_period_start: Optional[date] = None
    billing_period_end: Optional[date] = None
    subtotal: float
    tax_rate: Optional[float] = 0.10
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceGenerate(BaseModel):
    subscription_id: int
    due_days: Optional[int] = 14  # due in 14 days by default
    discount_id: Optional[int] = None
    tax_rate: Optional[float] = 0.10
    notes: Optional[str] = None

class InvoiceStatusUpdate(BaseModel):
    status: str  # draft, confirmed, paid

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    subscription_id: Optional[int] = None
    customer_id: int
    discount_id: Optional[int] = None
    status: str
    issue_date: date
    due_date: date
    billing_period_start: Optional[date] = None
    billing_period_end: Optional[date] = None
    subtotal: float
    discount_amount: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    amount_paid: float
    balance_due: float
    notes: Optional[str] = None
    created_at: datetime
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    subscription_number: Optional[str] = None
    discount_code: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceDetailResponse(InvoiceResponse):
    customer: Optional[dict] = None
    subscription: Optional[dict] = None
    discount: Optional[dict] = None
    payments: List[dict] = []
