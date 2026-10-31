from datetime import datetime
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_staff_or_admin
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.finance import DashboardSummaryResponse, RevenueChartPoint

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


def _customer_scope(current_user: User):
    return current_user.customer.id if current_user.role == "customer" and current_user.customer else None


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Aggregate dashboard metrics, scoped to the authenticated customer when applicable."""
    customer_id = _customer_scope(current_user)
    now_dt = datetime.utcnow()

    subscriptions = db.query(Subscription)
    invoices = db.query(Invoice)
    customers = db.query(Customer)
    if current_user.role == "customer":
        if customer_id is None:
            return DashboardSummaryResponse(
                active_subscriptions=0, total_revenue=Decimal("0"),
                outstanding_amount=Decimal("0"), overdue_invoices_count=0,
                total_customers=0, total_invoices=0, recent_invoices=[],
            )
        subscriptions = subscriptions.filter(Subscription.customer_id == customer_id)
        invoices = invoices.filter(Invoice.customer_id == customer_id)
        customers = customers.filter(Customer.id == customer_id)

    active_subs = subscriptions.filter(Subscription.status == "active").count()
    revenue = (
        db.query(func.sum(Payment.amount))
        .join(Invoice, Payment.invoice_id == Invoice.id)
    )
    if current_user.role == "customer":
        revenue = revenue.filter(Invoice.customer_id == customer_id)

    outstanding = invoices.filter(Invoice.status != "cancelled").with_entities(
        func.sum(Invoice.balance_due)
    ).scalar() or Decimal("0.00")
    overdue_count = invoices.filter(
        Invoice.status.notin_(["paid", "cancelled"]),
        Invoice.balance_due > Decimal("0.00"),
        Invoice.due_date < now_dt,
    ).count()
    recent_invoices = invoices.order_by(Invoice.id.desc()).limit(5).all()

    return DashboardSummaryResponse(
        active_subscriptions=active_subs,
        total_revenue=revenue.scalar() or Decimal("0.00"),
        outstanding_amount=outstanding,
        overdue_invoices_count=overdue_count,
        total_customers=customers.count(),
        total_invoices=invoices.count(),
        recent_invoices=recent_invoices,
    )


@router.get("/revenue", response_model=List[RevenueChartPoint])
def get_monthly_revenue_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return recorded payments by month, scoped to the customer's own invoices."""
    query = db.query(Payment).join(Invoice, Payment.invoice_id == Invoice.id)
    if current_user.role == "customer":
        customer_id = _customer_scope(current_user)
        if customer_id is None:
            return []
        query = query.filter(Invoice.customer_id == customer_id)

    monthly_data = {}
    for payment in query.order_by(Payment.payment_date.asc()).all():
        month_key = payment.payment_date.strftime("%b %Y")
        monthly_data[month_key] = monthly_data.get(month_key, Decimal("0.00")) + Decimal(str(payment.amount))
    return [RevenueChartPoint(month=month, revenue=amount) for month, amount in monthly_data.items()]


@router.get("/overdue")
def get_overdue_invoices(db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    """Return overdue invoices and their current outstanding balances to staff and admins."""
    today = datetime.utcnow().date()
    invoices = db.query(Invoice).filter(
        Invoice.status.notin_(["paid", "cancelled"]), Invoice.balance_due > Decimal("0.00")
    ).order_by(Invoice.due_date.asc()).all()
    overdue = []
    for invoice in invoices:
        due_date = invoice.due_date.date() if isinstance(invoice.due_date, datetime) else invoice.due_date
        if due_date and due_date < today:
            overdue.append({
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "customer_id": invoice.customer_id,
                "customer_name": invoice.customer.company_name or invoice.customer.name,
                "due_date": due_date.isoformat(),
                "days_overdue": (today - due_date).days,
                "outstanding_amount": str(invoice.balance_due),
                "status": "overdue" if invoice.status != "partially_paid" else "partially_paid",
            })
    return {
        "total_overdue_count": len(overdue),
        "total_overdue_amount": str(sum((Decimal(item["outstanding_amount"]) for item in overdue), Decimal("0.00"))),
        "items": overdue,
    }
