from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class FinancialSummary(BaseModel):
    active_subscriptions: int
    collected_this_month: float
    outstanding_amount: float
    pending_invoices: int
    mrr: float
    total_revenue_collected: float
    total_customers: int

class RevenuePulsePoint(BaseModel):
    period: str
    revenue: float
    invoiced: float

class SubscriptionDistribution(BaseModel):
    status: str
    count: int

class AttentionItem(BaseModel):
    type: str  # overdue_invoice, pending_payment, upcoming_renewal
    title: str
    description: str
    amount: Optional[float] = None
    date: Optional[str] = None
    entity_id: Optional[int] = None

class DashboardSummaryResponse(BaseModel):
    summary: FinancialSummary
    revenue_pulse: List[RevenuePulsePoint]
    subscription_distribution: List[SubscriptionDistribution]
    needs_attention: List[AttentionItem]
