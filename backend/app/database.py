from sqlalchemy import create_engine, event
from sqlalchemy import inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# SQLite connection args
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def upgrade_sqlite_schema():
    """Add integration-era subscription lifecycle columns to existing SQLite files."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    inspector = inspect(engine)
    if "subscriptions" not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns("subscriptions")}
    additions = {
        "subtotal_amount": "NUMERIC(12, 2) NOT NULL DEFAULT 0",
        "discount_amount": "NUMERIC(12, 2) NOT NULL DEFAULT 0",
        "auto_renew": "BOOLEAN NOT NULL DEFAULT 1",
        "pause_date": "DATE",
        "resume_date": "DATE",
        "closed_date": "DATE",
        "close_reason": "VARCHAR(255)",
    }
    with engine.begin() as connection:
        for name, sql_type in additions.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE subscriptions ADD COLUMN {name} {sql_type}"))


def get_db():
    """FastAPI dependency to yield a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
