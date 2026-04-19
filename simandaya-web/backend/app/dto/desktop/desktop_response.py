from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class StudentSyncDTO(BaseModel):
    """Student data for desktop app sync."""
    user_id: UUID = Field(..., description="Student user_id")
    nama_lengkap: str = Field(..., description="Student full name")
    nis: str | None = Field(None, description="Student NIS")
    kelas_jurusan: str | None = Field(None, description="Class and major")
    card_no: str | None = Field(None, description="RFID card number assigned via web admin")
    user_type: str = Field(..., description="Functional user type from user table")

    model_config = {"from_attributes": True}


class AttendanceAckDTO(BaseModel):
    """Acknowledgement response for an attendance event."""
    record_id: str = Field(..., description="Echo back desktop's local record ID")
    status: str = Field(..., description="'ok' or 'error'")
    published_at: datetime = Field(..., description="Server timestamp")
    detail: str | None = Field(None, description="Error message if status is 'error'")


class BulkAttendanceResponseDTO(BaseModel):
    """Response for a batch attendance sync request."""
    results: list[AttendanceAckDTO] = Field(..., description="Results for each synced event")


class PingResponseDTO(BaseModel):
    status: str = Field(..., description="'ok' if API is reachable")
    server_time: datetime = Field(..., description="Server UTC timestamp")


class CardReplaceResponseDTO(BaseModel):
    old_card_no: str | None = Field(None, description="Previous card number, for Hikvision revocation")
