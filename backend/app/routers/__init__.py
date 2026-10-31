from app.routers.auth import router as auth_router
from app.routers.billing import router as billing_router, invoices_router
from app.routers.customers import router as customers_router
from app.routers.dashboard import router as dashboard_router
from app.routers.discounts import router as discounts_router
from app.routers.payments import router as payments_router
from app.routers.plans import router as plans_router
from app.routers.products import router as products_router
from app.routers.subscriptions import router as subscriptions_router

__all__ = [
    "auth_router",
    "customers_router",
    "products_router",
    "plans_router",
    "subscriptions_router",
    "billing_router",
    "invoices_router",
    "payments_router",
    "dashboard_router",
    "discounts_router",
]
