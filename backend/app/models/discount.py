from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(String(50), nullable=False, default="percentage")  # fixed, percentage
    value = Column(Float, nullable=False, default=0.0)  # e.g., 10 for 10% or $10
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    invoices = relationship("Invoice", back_populates="discount")
