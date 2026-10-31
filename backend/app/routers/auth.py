import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin
from app.models.customer import Customer
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    StaffCreate,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.security import (
    create_access_token,
    hash_password,
    validate_password_complexity,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_customer(payload: UserRegister, db: Session = Depends(get_db)):
    """Customer self-registration.
    Validates email uniqueness and password complexity.
    Creates both the User account and linked Customer profile.
    """
    # 1. Check if email already registered
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 2. Check password complexity
    is_valid, error_msg = validate_password_complexity(payload.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    # 3. Create User record
    hashed = hash_password(payload.password)
    new_user = User(
        email=payload.email.lower(),
        hashed_password=hashed,
        role="customer",
        is_active=True,
    )
    db.add(new_user)
    db.flush()  # get new_user.id

    # 4. Create or link Customer profile
    customer_name = payload.name.strip() if payload.name and payload.name.strip() else payload.email.split("@")[0].title()
    customer = db.query(Customer).filter(Customer.email == payload.email.lower()).first()
    if customer:
        customer.user_id = new_user.id
        if payload.name:
            customer.name = customer_name
        if payload.company_name:
            customer.company_name = payload.company_name
        if payload.phone:
            customer.phone = payload.phone
    else:
        customer = Customer(
            user_id=new_user.id,
            name=customer_name,
            company_name=payload.company_name,
            email=payload.email.lower(),
            phone=payload.phone,
        )
        db.add(customer)
        db.flush()

    db.commit()
    db.refresh(new_user)
    db.refresh(customer)

    # 5. Issue JWT token
    token_data = {
        "sub": str(new_user.id),
        "email": new_user.email,
        "role": new_user.role,
        "customer_id": customer.id,
    }
    access_token = create_access_token(data=token_data)

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        email=new_user.email,
        customer_id=customer.id,
    )


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """User login for all roles (admin, staff, customer)."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator.",
        )

    customer_id = user.customer.id if user.customer else None

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "customer_id": customer_id,
    }
    access_token = create_access_token(data=token_data)

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        email=user.email,
        customer_id=customer_id,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve details of the currently authenticated user."""
    customer_id = current_user.customer.id if current_user.customer else None
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        customer_id=customer_id,
        created_at=current_user.created_at,
    )


@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_staff_user(
    payload: StaffCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only endpoint to create new internal staff members or additional admins."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Validate role
    role = payload.role.lower()
    if role not in ["staff", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'staff' or 'admin'.",
        )

    is_valid, error_msg = validate_password_complexity(payload.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    hashed = hash_password(payload.password)
    new_staff = User(
        email=payload.email.lower(),
        hashed_password=hashed,
        role=role,
        is_active=True,
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    return UserResponse(
        id=new_staff.id,
        email=new_staff.email,
        role=new_staff.role,
        is_active=new_staff.is_active,
        customer_id=None,
        created_at=new_staff.created_at,
    )


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a password reset token for the specified user email.
    In the hackathon setup, returns the token in response for testing/UI presentation.
    """
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        # Prevent email enumeration while still giving polite response
        return {
            "message": "If this email is registered, a password reset link has been dispatched.",
            "reset_token": None,
        }

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    return {
        "message": "Password reset token generated successfully.",
        "email": user.email,
        "reset_token": reset_token,
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a valid reset token."""
    user = (
        db.query(User)
        .filter(
            User.reset_token == payload.token,
            User.reset_token_expires > datetime.now(timezone.utc),
        )
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    is_valid, error_msg = validate_password_complexity(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password has been successfully updated. You may now log in."}
