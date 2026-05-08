from pydantic import BaseModel, Field, field_validator
from app.enums import UserType
import re


class SignupRequestDTO(BaseModel):
    """Request DTO for user signup"""

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "ahmad_siswa",
                    "password": "Password123",
                    "user_type": "Siswa",
                }
            ]
        }
    }

    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Username (3-100 chars, alphanumeric and underscore only)"
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=72,
        description="Password (8-72 chars, 1 uppercase, 1 lowercase, 1 digit)"
    )
    user_type: UserType = Field(
        ...,
        description="User type (Siswa, Guru, Admin)"
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format"""
        # Convert to lowercase
        v = v.lower().strip()

        # Check format (alphanumeric + underscore only)
        if not re.match(r'^[a-z0-9_]+$', v):
            raise ValueError("Username must contain only lowercase letters, numbers, and underscores")

        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one digit")

        return v


class LoginRequestDTO(BaseModel):
    """Request DTO for user login"""
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "ahmad_siswa",
                    "password": "Password123",
                }
            ]
        }
    }

    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")

    @field_validator("username")
    @classmethod
    def normalize_username(cls, v: str) -> str:
        """Normalize username to lowercase"""
        return v.lower().strip()
