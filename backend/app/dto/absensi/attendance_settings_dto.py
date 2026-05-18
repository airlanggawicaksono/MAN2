from pydantic import BaseModel, Field

from app.utils.wib_datetime import HhmmTime


class AttendanceSettingsResponseDTO(BaseModel):
    late_cutoff_time: HhmmTime = Field(..., description="Cutoff time for marking status as Terlambat")


class UpdateAttendanceSettingsDTO(BaseModel):
    late_cutoff_time: HhmmTime = Field(..., description="New cutoff time for lateness")
