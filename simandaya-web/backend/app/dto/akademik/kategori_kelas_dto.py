from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CreateKategoriKelasDTO(BaseModel):
    tahun_ajaran_id: UUID | None = Field(
        default=None,
        description="If omitted, active tahun ajaran will be used",
    )
    kode: str = Field(..., min_length=1, max_length=30)
    nama: str = Field(..., min_length=1, max_length=100)
    is_active: bool = True


class UpdateKategoriKelasDTO(BaseModel):
    kode: Optional[str] = Field(default=None, min_length=1, max_length=30)
    nama: Optional[str] = Field(default=None, min_length=1, max_length=100)
    is_active: Optional[bool] = None


class KategoriKelasResponseDTO(BaseModel):
    kategori_kelas_id: UUID
    tahun_ajaran_id: UUID
    kode: str
    nama: str
    is_active: bool


class KategoriKelasArchiveImpactDTO(BaseModel):
    kategori_kelas_id: UUID
    kelas_count: int
    kurikulum_count: int
