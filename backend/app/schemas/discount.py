from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DiscountBase(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = "percentage"  # fixed, percentage
    value: float
    is_active: Optional[bool] = True

class DiscountCreate(DiscountBase):
    pass

class DiscountUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    value: Optional[float] = None
    is_active: Optional[bool] = None

class DiscountResponse(DiscountBase):
    id: int
    created_at: datetime
    times_used: Optional[int] = 0

    class Config:
        from_attributes = True
