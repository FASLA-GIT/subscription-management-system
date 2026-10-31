from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    tax_id: Optional[str] = None

class CustomerCreate(CustomerBase):
    user_id: Optional[int] = None

class CustomerResponse(CustomerBase):
    id: int
    user_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
