from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class PaymentBase(BaseModel):
    invoice_id: int
    amount: float
    payment_date: Optional[date] = None
    payment_method: str = "Credit Card"  # Bank Transfer, Credit Card, Cash, UPI
    reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    payment_number: str
    created_at: datetime
    invoice_number: Optional[str] = None
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True
