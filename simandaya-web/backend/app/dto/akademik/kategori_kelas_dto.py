from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CreateKategoriKelasDTO(BaseModel):
    kode: str = Field(..., min_length=1, max_length=30)
    nama: str = Field(..., min_length=1, max_length=100)
    is_active: bool = True


class UpdateKategoriKelasDTO(BaseModel):
    kode: Optional[str] = Field(default=None, min_length=1, max_length=30)
    nama: Optional[str] = Field(default=None, min_length=1, max_length=100)
    is_active: Optional[bool] = None


class KategoriKelasResponseDTO(BaseModel):
    kategori_kelas_id: UUID
    kode: str
    nama: str
    is_active: bool
