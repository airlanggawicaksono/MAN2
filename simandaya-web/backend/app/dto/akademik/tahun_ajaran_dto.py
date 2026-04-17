from typing import Optional
from datetime import date
from pydantic import BaseModel, Field
from uuid import UUID


class CreateTahunAjaranDTO(BaseModel):
    nama: str = Field(..., min_length=1, max_length=20, description="e.g. 2025/2026")
    tanggal_mulai: date = Field(..., description="Start date")
    tanggal_selesai: date = Field(..., description="End date")
    is_active: bool = Field(default=False)


class UpdateTahunAjaranDTO(BaseModel):
    nama: Optional[str] = Field(default=None, max_length=20)
    tanggal_mulai: Optional[date] = None
    tanggal_selesai: Optional[date] = None
    is_active: Optional[bool] = None


class TahunAjaranResponseDTO(BaseModel):
    tahun_ajaran_id: UUID
    nama: str
    tanggal_mulai: date
    tanggal_selesai: date
    is_active: bool


class CopyTahunAjaranStructureDTO(BaseModel):
    source_tahun_ajaran_id: UUID = Field(..., description="Tahun ajaran sumber")
    nama: str = Field(..., min_length=1, max_length=20, description="e.g. 2026/2027")
    tanggal_mulai: date = Field(..., description="Start date tahun ajaran baru")
    tanggal_selesai: date = Field(..., description="End date tahun ajaran baru")
    is_active: bool = Field(default=False)
    copy_semester: bool = Field(default=True)
    copy_kelas: bool = Field(default=True)
    copy_guru_mapel: bool = Field(default=True)
    copy_kurikulum: bool = Field(default=True)


class CopyTahunAjaranStructureResponseDTO(BaseModel):
    tahun_ajaran: TahunAjaranResponseDTO
    copied_semester: int
    copied_kelas: int
    copied_guru_mapel: int
    copied_kurikulum: int
