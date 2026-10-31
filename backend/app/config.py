import os
from decimal import Decimal
from typing import List


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Brightloop Subscription Management System")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "brightloop-super-secret-jwt-key-for-hackathon-change-in-production"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./brightloop.db")
    
    # Standard software tax rate (18% GST)
    DEFAULT_TAX_RATE: Decimal = Decimal(os.getenv("DEFAULT_TAX_RATE", "18.00"))

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]


settings = Settings()
