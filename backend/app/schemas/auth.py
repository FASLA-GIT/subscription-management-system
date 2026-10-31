from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.security import validate_password_complexity


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., description="Password must be >8 characters, with 1 uppercase, 1 lowercase, 1 special character")
    name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        is_valid, error_msg = validate_password_complexity(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v


class StaffCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = Field("staff", description="Role of the staff member (staff or admin)")

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        is_valid, error_msg = validate_password_complexity(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: str
    customer_id: Optional[int] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    customer_id: Optional[int] = None
    name: Optional[str] = None
    company_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_new_password(cls, v: str) -> str:
        is_valid, error_msg = validate_password_complexity(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v
