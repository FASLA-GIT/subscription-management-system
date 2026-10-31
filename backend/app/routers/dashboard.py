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
from app.schemas.finance import DashboardSummaryResponse, InvoiceResponse, RevenueChartPoint

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Aggregate financial metrics and business indicators calculated from real DB data."""
    now_dt = datetime.utcnow()

    # Total active subscriptions
    active_subs = (
        db.query(func.count(Subscription.id))
        .filter(Subscription.status == "active")
        .scalar()
        or 0
    )

    # Total revenue received (sum of all recorded payments)
    total_rev = db.query(func.sum(Payment.amount)).scalar() or Decimal("0.00")

    # Outstanding balance across unpaid/partially paid invoices
    outstanding = (
        db.query(func.sum(Invoice.balance_due))
        .filter(Invoice.status != "cancelled")
        .scalar()
        or Decimal("0.00")
    )

    # Overdue invoices count (unpaid & due_date < now)
    overdue_count = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.status != "paid",
            Invoice.status != "cancelled",
            Invoice.due_date < now_dt,
        )
        .scalar()
        or 0
    )

    # Total registered customers
    total_customers = db.query(func.count(Customer.id)).scalar() or 0

    # Recent 5 invoices
    recent_invoices = (
        db.query(Invoice)
        .order_by(Invoice.id.desc())
        .limit(5)
        .all()
    )

    return DashboardSummaryResponse(
        active_subscriptions=active_subs,
        total_revenue=Decimal(str(total_rev)),
        outstanding_amount=Decimal(str(outstanding)),
        overdue_invoices_count=overdue_count,
        total_customers=total_customers,
        recent_invoices=recent_invoices,
    )


@router.get("/revenue", response_model=List[RevenueChartPoint])
def get_monthly_revenue_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Return monthly aggregated revenue for frontend Recharts visualization."""
    payments = db.query(Payment).order_by(Payment.payment_date.asc()).all()

    # Aggregate by Month YYYY-MM
    monthly_data = {}
    for p in payments:
        month_key = p.payment_date.strftime("%b %Y")
        monthly_data[month_key] = monthly_data.get(month_key, Decimal("0.00")) + Decimal(str(p.amount))

    # If no payments yet, provide empty or current month
    if not monthly_data:
        curr_month = datetime.utcnow().strftime("%b %Y")
        return [RevenueChartPoint(month=curr_month, revenue=Decimal("0.00"))]

    return [
        RevenueChartPoint(month=m, revenue=val)
        for m, val in monthly_data.items()
    ]
