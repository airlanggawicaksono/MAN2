from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID
from app.enums import TingkatKelas


class CreateKelasDTO(BaseModel):
    tahun_ajaran_id: UUID = Field(...)
    nama_kelas: str = Field(..., min_length=1, max_length=50, description="e.g. X-A")
    tingkat: TingkatKelas = Field(...)
    kategori_kelas_id: UUID = Field(...)
    wali_kelas_id: Optional[UUID] = None
    kapasitas: int = Field(default=36, ge=1, le=100)


class UpdateKelasDTO(BaseModel):
    nama_kelas: Optional[str] = Field(default=None, max_length=50)
    tingkat: Optional[TingkatKelas] = None
    kategori_kelas_id: Optional[UUID] = None
    wali_kelas_id: Optional[UUID] = None
    kapasitas: Optional[int] = Field(default=None, ge=1, le=100)


class KelasResponseDTO(BaseModel):
    kelas_id: UUID
    tahun_ajaran_id: UUID
    nama_kelas: str
    tingkat: TingkatKelas
    kategori_kelas_id: UUID
    kategori_kelas_nama: Optional[str] = None
    jurusan: Optional[str]
    wali_kelas_id: Optional[UUID]
    wali_kelas_nama: Optional[str] = None
    kapasitas: int


class AssignSiswaDTO(BaseModel):
    user_id: UUID = Field(..., description="Student user_id to assign")


class SiswaKelasResponseDTO(BaseModel):
    siswa_kelas_id: UUID
    kelas_id: UUID
    user_id: UUID
    nama_lengkap: Optional[str] = None
    nis: Optional[str] = None


class PromoteStudentsDTO(BaseModel):
    from_tahun_ajaran_id: UUID = Field(..., description="Previous academic year")
    to_tahun_ajaran_id: UUID = Field(..., description="New academic year")


class PromoteResultDTO(BaseModel):
    promoted: int = 0
    graduated: int = 0
    skipped: int = 0
    message: str


class MessageResponseDTO(BaseModel):
    message: str
