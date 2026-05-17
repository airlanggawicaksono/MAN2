from typing import Optional
from pydantic import BaseModel, Field


class ClaimJobRequestDTO(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=64, description="Stable device identifier")


class CompleteJobRequestDTO(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=64)


class FailJobRequestDTO(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=64)
    error: str = Field(..., min_length=1, max_length=2000)
    retry_in_seconds: Optional[int] = Field(
        None, ge=1, le=86400,
        description="Override default backoff. If null, uses exponential backoff based on retry_count.",
    )
