"""Create an administrator interactively when a database has no admin account."""

from getpass import getpass

from pydantic import TypeAdapter, EmailStr, ValidationError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import *  # noqa: F401,F403 - register all models before create_all
from app.models.user import User
from app.security import hash_password, validate_password_complexity


def create_first_admin(db: Session, email: str, password: str) -> User:
    """Create the first administrator once; serialize SQLite bootstrap attempts."""
    if db.get_bind().dialect.name == "sqlite":
        # Acquire the SQLite write lock before checking so two simultaneous
        # bootstrap processes cannot both observe an empty admin set.
        db.execute(text("BEGIN IMMEDIATE"))

    if db.query(User).filter(User.role == "admin").first():
        db.rollback()
        raise ValueError("An administrator account already exists; use its authenticated staff-management endpoint.")

    if db.query(User).filter(User.email == email).first():
        db.rollback()
        raise ValueError("An account with this email already exists.")

    valid, reason = validate_password_complexity(password)
    if not valid:
        db.rollback()
        raise ValueError(reason)

    admin = User(email=email, hashed_password=hash_password(password), role="admin", is_active=True)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def main() -> None:
    Base.metadata.create_all(bind=engine)
    email_adapter = TypeAdapter(EmailStr)
    email = input("Administrator email: ").strip().lower()
    try:
        email = str(email_adapter.validate_python(email)).lower()
    except ValidationError as exc:
        raise SystemExit("Enter a valid email address.") from exc

    password = getpass("Administrator password: ")
    valid, reason = validate_password_complexity(password)
    if not valid:
        raise SystemExit(reason)
    if password != getpass("Confirm password: "):
        raise SystemExit("Passwords do not match.")

    db = SessionLocal()
    try:
        try:
            create_first_admin(db, email, password)
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc
        print("Administrator account created. Sign in with the email and password you entered.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
