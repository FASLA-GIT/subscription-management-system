from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.finance import (
    DashboardSummaryResponse,
    RevenueTrendResponse,
    OverdueInvoicesResponse
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Financial Reports"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns real-time financial KPI metrics calculated directly from database records:
    - Total active subscriptions
    - Total revenue collected
    - Total outstanding balance
    - Total overdue amount & count
    - Invoices breakdown by status
    """
    return DashboardService.get_summary(db)

@router.get("/revenue", response_model=RevenueTrendResponse)
def get_revenue_trends(
    period: str = Query("daily", pattern="^(daily|monthly)$", description="Aggregation frequency"),
    db: Session = Depends(get_db)
):
    """Returns revenue timeseries data for Recharts revenue charts."""
    return DashboardService.get_revenue_trends(db, period=period)

@router.get("/overdue", response_model=OverdueInvoicesResponse)
def get_overdue_invoices(db: Session = Depends(get_db)):
    """Returns detailed list of overdue invoices with customer and aging days."""
    return DashboardService.get_overdue_invoices(db)
