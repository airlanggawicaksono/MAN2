from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class UserResponseDTO(BaseModel):
    """Response DTO for user data"""

    user_id: UUID = Field(..., description="User unique ID")
    username: Optional[str] = Field(None, description="Username")
    user_type: str = Field(..., description="User role (Siswa, Guru, Admin)")
    registration_status: str = Field(..., description="Registration status (Pending, Completed)")
    created_at: datetime = Field(..., description="Account creation timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    is_active: bool = Field(..., description="Account active status")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "username": "testuser",
                "user_type": "Siswa",
                "created_at": "2024-01-01T00:00:00Z",
                "last_login": "2024-01-02T12:00:00Z",
                "is_active": True
            }
        }
    }


class TokenResponseDTO(BaseModel):
    """Response DTO for authentication tokens"""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")
    user: UserResponseDTO = Field(..., description="User information")

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "user": {
                    "user_id": "123e4567-e89b-12d3-a456-426614174000",
                    "username": "testuser",
                    "user_type": "Siswa",
                    "created_at": "2024-01-01T00:00:00Z",
                    "last_login": "2024-01-02T12:00:00Z",
                    "is_active": True
                }
            }
        }
    }


class SignupResponseDTO(BaseModel):
    """Response DTO for signup"""

    message: str = Field(..., description="Success message")
    user: UserResponseDTO = Field(..., description="Created user information")

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "User created successfully",
                "user": {
                    "user_id": "123e4567-e89b-12d3-a456-426614174000",
                    "username": "testuser",
                    "user_type": "Siswa",
                    "created_at": "2024-01-01T00:00:00Z",
                    "last_login": None,
                    "is_active": True
                }
            }
        }
    }


class MessageResponseDTO(BaseModel):
    """Generic message response"""

    message: str = Field(..., description="Response message")

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Operation successful"
            }
        }
    }
