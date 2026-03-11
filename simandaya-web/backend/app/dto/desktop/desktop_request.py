from datetime import time, datetime
from uuid import UUID
from typing import Optional, Literal
from pydantic import BaseModel, Field


class AttendanceEventDTO(BaseModel):
    """Incoming attendance event from desktop app via WebSocket."""
    record_id: str = Field(..., description="Desktop's local tap_record UUID (for ack)")
    user_id: UUID = Field(..., description="Student user_id")
    event_type: Literal["absen_masuk", "absen_keluar", "izin"] = Field(
        ..., description="Type of attendance event"
    )
    device_time: datetime = Field(..., description="Timestamp from Hikvision device")
    reason: Optional[str] = Field(
        None, description="Required when event_type is 'izin'"
    )


class BulkAttendanceSyncDTO(BaseModel):
    """Request to sync multiple attendance events via HTTP POST."""
    events: list[AttendanceEventDTO] = Field(..., description="List of events to sync")


class UpdateDesktopSettingsDTO(BaseModel):
    """Request to update desktop settings (admin only)."""
    late_cutoff_time: time = Field(..., description="Late cutoff time, e.g. '07:15:00'")
