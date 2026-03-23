from typing import Optional
from datetime import date
from pydantic import BaseModel, Field
from uuid import UUID
from app.enums import TipeSemester


class CreateSemesterDTO(BaseModel):
    tahun_ajaran_id: UUID = Field(..., description="Academic year ID")
    tipe: TipeSemester = Field(..., description="Ganjil / Genap")
    tanggal_mulai: date = Field(...)
    tanggal_selesai: date = Field(...)
    is_active: bool = Field(default=False)


class UpdateSemesterDTO(BaseModel):
    tanggal_mulai: Optional[date] = None
    tanggal_selesai: Optional[date] = None
    is_active: Optional[bool] = None


class SemesterResponseDTO(BaseModel):
    semester_id: UUID
    tahun_ajaran_id: UUID
    tipe: TipeSemester
    tanggal_mulai: date
    tanggal_selesai: date
    is_active: bool


class CopySemesterStructureDTO(BaseModel):
    source_semester_id: UUID = Field(..., description="Semester sumber untuk disalin strukturnya")
    tipe: TipeSemester = Field(..., description="Tipe semester target (Ganjil/Genap)")
    tanggal_mulai: date = Field(...)
    tanggal_selesai: date = Field(...)
    is_active: bool = Field(default=False)


class CopySemesterStructureResponseDTO(BaseModel):
    semester: SemesterResponseDTO
    copied_jadwal: int
    copied_rapor_bobot: int
