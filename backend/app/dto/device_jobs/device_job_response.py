from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class DeviceJobDTO(BaseModel):
    id: UUID
    job_type: str = Field(..., description="e.g. 'hik.card.sync'")
    payload: dict = Field(..., description="Type-specific JSON data")
    status: str
    related_user_id: Optional[UUID] = None
    retry_count: int
    last_error: Optional[str] = None
    next_retry_at: Optional[datetime] = None
    created_at: datetime
    claimed_by: Optional[str] = None
    claimed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ClaimResponseDTO(BaseModel):
    claimed: bool = Field(..., description="True if this device successfully claimed the job")
    job: Optional[DeviceJobDTO] = Field(None, description="The job after claim, or null if lost race")


class AckResponseDTO(BaseModel):
    ok: bool = True
