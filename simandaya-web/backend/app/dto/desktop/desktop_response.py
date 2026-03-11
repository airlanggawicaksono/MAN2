from datetime import time, datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field


class StudentSyncDTO(BaseModel):
    """Student data for desktop app sync."""
    user_id: UUID = Field(..., description="Student user_id")
    nama_lengkap: str = Field(..., description="Student full name")
    nis: Optional[str] = Field(None, description="Student NIS")
    kelas_jurusan: Optional[str] = Field(None, description="Class and major")

    model_config = {"from_attributes": True}


class AttendanceAckDTO(BaseModel):
    """Acknowledgement response for an attendance event."""
    record_id: str = Field(..., description="Echo back desktop's local record ID")
    status: str = Field(..., description="'ok' or 'error'")
    published_at: datetime = Field(..., description="Server timestamp")
    detail: Optional[str] = Field(None, description="Error message if status is 'error'")


class BulkAttendanceResponseDTO(BaseModel):
    """Response for a batch attendance sync request."""
    results: list[AttendanceAckDTO] = Field(..., description="Results for each synced event")


class DesktopSettingsDTO(BaseModel):
    """Desktop settings response."""
    late_cutoff_time: time = Field(..., description="Late cutoff time")
    updated_at: Optional[datetime] = Field(None, description="Last updated timestamp")
