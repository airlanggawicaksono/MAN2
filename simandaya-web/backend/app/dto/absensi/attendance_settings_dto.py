from datetime import time

from pydantic import BaseModel, Field


class AttendanceSettingsResponseDTO(BaseModel):
    late_cutoff_time: time = Field(..., description="Cutoff time for marking status as Terlambat")


class UpdateAttendanceSettingsDTO(BaseModel):
    late_cutoff_time: time = Field(..., description="New cutoff time for lateness")
