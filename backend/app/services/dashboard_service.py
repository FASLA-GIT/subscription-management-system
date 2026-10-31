from datetime import date
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case

from app.models.subscription import Subscription, SubscriptionStatus
from app.models.finance import Invoice, Payment, InvoiceStatus
from app.models.user import Customer
from app.schemas.finance import (
    DashboardSummaryResponse, InvoiceStatusCount,
    RevenueTrendResponse, RevenueTrendPoint,
    OverdueInvoicesResponse, OverdueInvoiceItem
)

class DashboardService:
    @classmethod
    def get_summary(cls, db: Session) -> DashboardSummaryResponse:
        """
        Computes high-level financial KPIs from real database records.
        """
        today = date.today()

        # 1. Total Active Subscriptions
        active_subs_count = db.query(func.count(Subscription.id)).filter(
            Subscription.status == SubscriptionStatus.ACTIVE
        ).scalar() or 0

        # 2. Total Revenue Received (Sum of all payments)
        total_revenue = db.query(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).scalar() or Decimal("0.00")

        # 3. Total Outstanding Amount (Unpaid balances on non-cancelled invoices)
        total_outstanding = db.query(
            func.coalesce(func.sum(Invoice.outstanding_amount), Decimal("0.00"))
        ).filter(
            Invoice.status.in_([InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
            Invoice.outstanding_amount > Decimal("0.00")
        ).scalar() or Decimal("0.00")

        # 4. Overdue Invoices: due_date < today and outstanding_amount > 0 and status != cancelled
        overdue_query = db.query(Invoice).filter(
            Invoice.due_date < today,
            Invoice.outstanding_amount > Decimal("0.00"),
            Invoice.status != InvoiceStatus.CANCELLED
        )
        overdue_count = overdue_query.count()
        overdue_amount = db.query(
            func.coalesce(func.sum(Invoice.outstanding_amount), Decimal("0.00"))
        ).filter(
            Invoice.due_date < today,
            Invoice.outstanding_amount > Decimal("0.00"),
            Invoice.status != InvoiceStatus.CANCELLED
        ).scalar() or Decimal("0.00")

        # 5. Invoices Breakdown by Status
        status_groups = db.query(
            Invoice.status,
            func.count(Invoice.id).label("count"),
            func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00")).label("total_amount")
        ).group_by(Invoice.status).all()

        invoices_by_status = [
            InvoiceStatusCount(
                status=sg[0].value if hasattr(sg[0], "value") else str(sg[0]),
                count=sg[1],
                total_amount=Decimal(str(sg[2]))
            )
            for sg in status_groups
        ]

        total_invoices_count = db.query(func.count(Invoice.id)).scalar() or 0

        return DashboardSummaryResponse(
            total_active_subscriptions=active_subs_count,
            total_revenue=Decimal(str(total_revenue)),
            total_outstanding=Decimal(str(total_outstanding)),
            total_overdue_amount=Decimal(str(overdue_amount)),
            overdue_invoices_count=overdue_count,
            invoices_by_status=invoices_by_status,
            total_invoices_count=total_invoices_count
        )

    @classmethod
    def get_revenue_trends(cls, db: Session, period: str = "daily") -> RevenueTrendResponse:
        """
        Aggregates revenue history over time for dashboard charts.
        """
        # SQLite supports strftime for date grouping
        date_format = "%Y-%m-%d" if period == "daily" else "%Y-%m"

        trends_query = db.query(
            func.strftime(date_format, Payment.payment_date).label("period_group"),
            func.sum(Payment.amount).label("total_revenue"),
            func.count(Payment.id).label("payment_count")
        ).group_by("period_group").order_by("period_group").all()

        points = []
        total_period_revenue = Decimal("0.00")

        for row in trends_query:
            rev = Decimal(str(row[1]))
            total_period_revenue += rev
            points.append(RevenueTrendPoint(
                date=str(row[0]),
                revenue=rev,
                payment_count=row[2]
            ))

        return RevenueTrendResponse(
            period=period,
            total_period_revenue=total_period_revenue,
            trends=points
        )

    @classmethod
    def get_overdue_invoices(cls, db: Session) -> OverdueInvoicesResponse:
        """
        Lists all overdue invoices with customer details and days overdue.
        """
        today = date.today()

        overdue_invoices = db.query(Invoice).join(Customer).filter(
            Invoice.due_date < today,
            Invoice.outstanding_amount > Decimal("0.00"),
            Invoice.status != InvoiceStatus.CANCELLED
        ).order_by(Invoice.due_date.asc()).all()

        items = []
        total_overdue_amount = Decimal("0.00")

        for inv in overdue_invoices:
            days_overdue = (today - inv.due_date).days
            outstanding = Decimal(str(inv.outstanding_amount))
            total_overdue_amount += outstanding

            items.append(OverdueInvoiceItem(
                id=inv.id,
                invoice_number=inv.invoice_number,
                customer_id=inv.customer_id,
                customer_name=inv.customer.company_name if inv.customer else "Unknown",
                customer_email=inv.customer.email if inv.customer else "",
                subscription_number=inv.subscription.subscription_number if inv.subscription else "",
                issue_date=inv.issue_date,
                due_date=inv.due_date,
                days_overdue=days_overdue,
                total_amount=Decimal(str(inv.total_amount)),
                amount_paid=Decimal(str(inv.amount_paid)),
                outstanding_amount=outstanding
            ))

        return OverdueInvoicesResponse(
            total_overdue_count=len(items),
            total_overdue_amount=total_overdue_amount,
            items=items
        )
