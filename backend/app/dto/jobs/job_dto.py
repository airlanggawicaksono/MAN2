from datetime import datetime
from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel
from app.enums import JobStatus, JobType


class JobResponseDTO(BaseModel):
    job_id: UUID
    user_id: UUID
    job_type: JobType
    status: JobStatus
    idempotency_key: str
    payload: Optional[dict[str, Any]] = None
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    progress: int
    total: int
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
