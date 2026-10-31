from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
import app.models  # Ensures all models are registered with Base metadata
from app.routers import (
    auth, customers, products, plans, subscriptions,
    billing, payments, discounts, dashboard
)

# Auto-create all tables in SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Unified API for Products, Subscriptions, Automatic Invoicing, Payments, Discounts & Financial Reporting."
)

# Enable CORS for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during hackathon development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all endpoint routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(customers.router, prefix=api_prefix)
app.include_router(products.router, prefix=api_prefix)
app.include_router(plans.router, prefix=api_prefix)
app.include_router(subscriptions.router, prefix=api_prefix)
app.include_router(billing.router, prefix=api_prefix)
app.include_router(payments.router, prefix=api_prefix)
app.include_router(discounts.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)

@app.get("/", tags=["Health"])
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "documentation": "/docs"
    }

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
