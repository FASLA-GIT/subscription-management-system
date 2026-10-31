import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Brightloop Subscription Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./brightloop.db"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "brightloop-secret-key-hackathon-2026-supersecure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Default Tax Configuration (e.g. 18% standard GST for software/SaaS)
    DEFAULT_TAX_RATE: float = 18.00
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
