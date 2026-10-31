from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
import app.models  # Ensures all models are registered
from app.routers.products import router as products_router, variant_router
from app.routers.plans import router as plans_router
from app.routers.subscriptions import router as subscriptions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Brightloop Subscription Management System API",
    description="Automated subscription lifecycle, billing frequencies, product management, and recurring invoice coordination.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Frontend (React + Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Subscription Module Routers (Fasla)
app.include_router(products_router)
app.include_router(variant_router)
app.include_router(plans_router)
app.include_router(subscriptions_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "system": "Brightloop Subscription Management System",
        "status": "online",
        "docs_url": "/docs",
        "module": "Subscriptions, Products & Plans (Fasla)"
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "sqlite",
        "modules_loaded": ["products", "variants", "plans", "subscriptions"]
    }
