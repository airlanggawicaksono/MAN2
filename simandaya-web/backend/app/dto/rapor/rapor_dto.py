from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from app.enums import JenisTugas


# ── Request DTOs ────────────────────────────────────────────────────────────


class GenerateRaporDTO(BaseModel):
    kelas_id: UUID = Field(...)
    semester_id: UUID = Field(...)


class UpdateRaporDTO(BaseModel):
    catatan_wali_kelas: Optional[str] = None


class OverrideNilaiDTO(BaseModel):
    nilai_akhir: float = Field(..., ge=0, le=100)
    catatan: Optional[str] = Field(default=None, max_length=500)


class BobotJenisDTO(BaseModel):
    jenis_tugas: JenisTugas
    bobot: float = Field(..., ge=0, le=100)


class SetRaporBobotDTO(BaseModel):
    kelas_id: UUID
    semester_id: UUID
    mapel_id: UUID
    weights: list[BobotJenisDTO] = Field(..., min_length=1)


# ── Response DTOs ───────────────────────────────────────────────────────────


class AttendanceSummaryDTO(BaseModel):
    hadir: int = 0
    sakit: int = 0
    izin: int = 0
    alfa: int = 0
    terlambat: int = 0


class RaporNilaiResponseDTO(BaseModel):
    rapor_nilai_id: UUID
    rapor_id: UUID
    mapel_id: UUID
    mapel_nama: str
    nilai_akhir: float
    is_manual_override: bool
    catatan: Optional[str]


class RaporResponseDTO(BaseModel):
    rapor_id: UUID
    user_id: UUID
    semester_id: UUID
    kelas_id: UUID
    catatan_wali_kelas: Optional[str]
    is_published: bool
    published_at: Optional[datetime]
    grades: list[RaporNilaiResponseDTO]
    attendance_summary: AttendanceSummaryDTO


class RaporListItemDTO(BaseModel):
    rapor_id: UUID
    user_id: UUID
    username: str
    nama_lengkap: str
    is_published: bool
    published_at: Optional[datetime]


class RaporBobotResponseDTO(BaseModel):
    rapor_bobot_id: UUID
    kelas_id: UUID
    semester_id: UUID
    mapel_id: UUID
    jenis_tugas: JenisTugas
    bobot: float


class GenerateRaporResponseDTO(BaseModel):
    message: str
    rapor_generated: int
    rapor_skipped: int


class MessageResponseDTO(BaseModel):
    message: str
