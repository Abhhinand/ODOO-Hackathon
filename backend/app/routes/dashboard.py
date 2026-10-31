from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.customer import Customer
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryResponse, FinancialSummary, RevenuePulsePoint, SubscriptionDistribution, AttentionItem
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    first_of_month = date(today.year, today.month, 1)

    is_customer = (current_user.role == "customer")
    customer_id = current_user.customer_id if is_customer else None

    # Base queries filtered if customer
    sub_query = db.query(Subscription)
    inv_query = db.query(Invoice)
    pay_query = db.query(Payment)
    cust_query = db.query(Customer)

    if is_customer and customer_id:
        sub_query = sub_query.filter(Subscription.customer_id == customer_id)
        inv_query = inv_query.filter(Invoice.customer_id == customer_id)
        pay_query = pay_query.join(Invoice).filter(Invoice.customer_id == customer_id)
        cust_query = cust_query.filter(Customer.id == customer_id)

    # 1. Financial Indicators
    active_subs = sub_query.filter(Subscription.status == "active").all()
    active_subs_count = len(active_subs)

    # Calculate MRR (Monthly Recurring Revenue)
    mrr = 0.0
    for s in active_subs:
        interval = s.plan.billing_interval if s.plan else "monthly"
        if interval == "yearly":
            mrr += s.amount / 12.0
        else:
            mrr += s.amount

    # Payments this month
    payments_this_month = pay_query.filter(Payment.payment_date >= first_of_month).all()
    collected_this_month = sum(p.amount for p in payments_this_month)

    all_payments = pay_query.all()
    total_revenue_collected = sum(p.amount for p in all_payments)

    # Pending invoices & outstanding amount
    pending_invoices = inv_query.filter(Invoice.balance_due > 0.01).all()
    outstanding_amount = sum(i.balance_due for i in pending_invoices)
    pending_invoices_count = len(pending_invoices)

    total_customers = cust_query.count()

    summary = FinancialSummary(
        active_subscriptions=active_subs_count,
        collected_this_month=round(collected_this_month, 2),
        outstanding_amount=round(outstanding_amount, 2),
        pending_invoices=pending_invoices_count,
        mrr=round(mrr, 2),
        total_revenue_collected=round(total_revenue_collected, 2),
        total_customers=total_customers
    )

    # 2. Revenue Pulse (Last 6 months trend)
    pulse_points = []
    # Generate previous 5 months + current month
    for i in range(5, -1, -1):
        # Approximate month step
        m_date = today - timedelta(days=i * 30)
        m_start = date(m_date.year, m_date.month, 1)
        if m_date.month == 12:
            m_end = date(m_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            m_end = date(m_date.year, m_date.month + 1, 1) - timedelta(days=1)

        month_label = m_start.strftime("%b %Y")

        month_pays = pay_query.filter(Payment.payment_date >= m_start, Payment.payment_date <= m_end).all()
        month_rev = sum(p.amount for p in month_pays)

        month_invs = inv_query.filter(Invoice.issue_date >= m_start, Invoice.issue_date <= m_end).all()
        month_invoiced = sum(inv.total_amount for inv in month_invs)

        pulse_points.append(RevenuePulsePoint(
            period=month_label,
            revenue=round(month_rev, 2),
            invoiced=round(month_invoiced, 2)
        ))

    # 3. Subscription Distribution
    all_subs = sub_query.all()
    status_counts = {"active": 0, "confirmed": 0, "draft": 0, "closed": 0}
    for s in all_subs:
        st = s.status.lower()
        if st in status_counts:
            status_counts[st] += 1
        else:
            status_counts["draft"] += 1

    distribution = [
        SubscriptionDistribution(status=k.capitalize(), count=v)
        for k, v in status_counts.items()
    ]

    # 4. Needs Attention
    attention: List[AttentionItem] = []

    # Overdue Invoices
    overdue_invoices = inv_query.filter(
        Invoice.due_date < today,
        Invoice.balance_due > 0.01
    ).order_by(Invoice.due_date.asc()).limit(5).all()

    for inv in overdue_invoices:
        attention.append(AttentionItem(
            type="overdue_invoice",
            title=f"Overdue Invoice: {inv.invoice_number}",
            description=f"Due on {inv.due_date} for {inv.customer.name if inv.customer else 'Customer'}",
            amount=inv.balance_due,
            date=str(inv.due_date),
            entity_id=inv.id
        ))

    # Pending Payments with large balances
    high_pending = [inv for inv in pending_invoices if inv not in overdue_invoices][:3]
    for inv in high_pending:
        attention.append(AttentionItem(
            type="pending_payment",
            title=f"Awaiting Payment: {inv.invoice_number}",
            description=f"Due {inv.due_date} for {inv.customer.name if inv.customer else 'Customer'}",
            amount=inv.balance_due,
            date=str(inv.due_date),
            entity_id=inv.id
        ))

    # Upcoming Renewals in next 14 days
    renewals = sub_query.filter(
        Subscription.status == "active",
        Subscription.next_billing_date >= today,
        Subscription.next_billing_date <= today + timedelta(days=14)
    ).limit(3).all()

    for ren in renewals:
        attention.append(AttentionItem(
            type="upcoming_renewal",
            title=f"Renewal Due: {ren.subscription_number}",
            description=f"{ren.customer.name if ren.customer else 'Customer'} - {ren.plan.name if ren.plan else 'Plan'}",
            amount=ren.amount,
            date=str(ren.next_billing_date),
            entity_id=ren.id
        ))

    return DashboardSummaryResponse(
        summary=summary,
        revenue_pulse=pulse_points,
        subscription_distribution=distribution,
        needs_attention=attention
    )
