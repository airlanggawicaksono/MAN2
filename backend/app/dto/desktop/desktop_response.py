from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class StudentSyncDTO(BaseModel):
    """Student data for desktop app sync."""
    user_id: UUID = Field(..., description="Student user_id")
    nama_lengkap: str = Field(..., description="Student full name")
    nisn: str | None = Field(None, description="Student NISN")
    kelas_jurusan: str | None = Field(None, description="Class and major")
    rfid_number: str | None = Field(None, description="RFID card number assigned via web admin")
    no_telephone_wali: str | None = Field(None, description="Guardian WhatsApp phone number")
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


class CardSetResponseDTO(BaseModel):
    """
    Unified card mutation response.

    BE has already committed the canonical change to siswa_profile.rfid_number
    and enqueued a hik.card.sync DeviceJob. The sijinak worker will pick that
    job up (via WS notification or next poll) and reconcile Hikvision.
    """
    user_id: UUID
    old_rfid_number: str | None = Field(None, description="Previous card number on the student, if any")
    new_rfid_number: str | None = Field(None, description="New card number (null if removed)")
    job_id: UUID = Field(..., description="ID of the enqueued hik.card.sync DeviceJob")
