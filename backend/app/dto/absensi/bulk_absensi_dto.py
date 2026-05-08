from datetime import date
from pydantic import BaseModel, Field
from uuid import UUID
from app.enums import StatusAbsensi


class StudentAbsensiEntry(BaseModel):
    user_id: UUID = Field(...)
    status: StatusAbsensi = Field(...)


class BulkAbsensiCreateDTO(BaseModel):
    kelas_id: UUID = Field(...)
    tanggal: date = Field(...)
    entries: list[StudentAbsensiEntry] = Field(..., min_length=1)


class BulkAbsensiResponseDTO(BaseModel):
    created_count: int
    updated_count: int
    message: str
