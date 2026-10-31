from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_staff_or_admin
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, company, or email"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List customers with search and pagination.
    - Admins and Staff see all customers.
    - Customers only see their own profile.
    """
    query = db.query(Customer)

    # Role-based scoping: customer can only see their own record
    if current_user.role == "customer":
        if not current_user.customer:
            return CustomerListResponse(total=0, items=[])
        query = query.filter(Customer.id == current_user.customer.id)
    else:
        # Filter for staff/admin
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Customer.name.ilike(search_term),
                    Customer.email.ilike(search_term),
                    Customer.company_name.ilike(search_term),
                )
            )
        if is_active is not None:
            query = query.filter(Customer.is_active == is_active)

    total = query.count()
    items = query.order_by(Customer.id.desc()).offset(skip).limit(limit).all()

    return CustomerListResponse(total=total, items=items)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Create a new customer (Admin or Staff only)."""
    # Check if email is already registered
    existing_customer = db.query(Customer).filter(Customer.email == payload.email.lower()).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer with this email address already exists.",
        )

    # If user_id is provided, verify it exists
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with id {payload.user_id} does not exist.",
            )

    customer_data = payload.model_dump()
    customer_data["email"] = customer_data["email"].lower()
    new_customer = Customer(**customer_data)

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@router.get("/me", response_model=CustomerResponse)
def get_my_customer_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve the customer profile linked to the logged-in user."""
    if not current_user.customer:
        # Create a stub customer profile if none exists for this user
        customer = Customer(
            user_id=current_user.id,
            name=current_user.email.split("@")[0].title(),
            email=current_user.email,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer

    return current_user.customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific customer by ID.
    Customers can only access their own profile.
    """
    if current_user.role == "customer":
        if not current_user.customer or current_user.customer.id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view another customer's profile.",
            )

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} was not found.",
        )

    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update customer details.
    Customers can update their own details. Admins and Staff can update any customer.
    """
    if current_user.role == "customer":
        if not current_user.customer or current_user.customer.id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to modify another customer's profile.",
            )

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} was not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    # Customers cannot change their own active status
    if current_user.role == "customer" and "is_active" in update_data:
        del update_data["is_active"]

    # If updating email, ensure uniqueness
    if "email" in update_data and update_data["email"]:
        new_email = update_data["email"].lower()
        if new_email != customer.email:
            existing = db.query(Customer).filter(Customer.email == new_email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A customer with this email address already exists.",
                )
            update_data["email"] = new_email

    for key, value in update_data.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)
    return customer
