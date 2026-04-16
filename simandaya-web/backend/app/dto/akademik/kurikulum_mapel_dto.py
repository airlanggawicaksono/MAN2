from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field
from app.enums import TingkatKelas


class CreateKurikulumMapelDTO(BaseModel):
    mapel_id: UUID
    tahun_ajaran_id: UUID
    tingkat: TingkatKelas
    kategori_kelas_id: UUID
    is_wajib: bool = Field(default=True)
    jam_override: Optional[int] = Field(default=None, ge=1, le=20)


class BulkAssignKurikulumMapelDTO(BaseModel):
    tahun_ajaran_id: UUID
    tingkat: TingkatKelas
    kategori_kelas_id: UUID
    mapel_ids: list[UUID] = Field(..., min_length=1)
    is_wajib: bool = Field(default=True)


class UpdateKurikulumMapelDTO(BaseModel):
    is_wajib: Optional[bool] = Field(default=None)
    jam_override: Optional[int] = Field(default=None, ge=1, le=20)


class KurikulumMapelResponseDTO(BaseModel):
    kurikulum_mapel_id: UUID
    mapel_id: UUID
    tahun_ajaran_id: UUID
    tingkat: TingkatKelas
    kategori_kelas_id: UUID
    kategori_kelas_nama: Optional[str] = None
    is_active: bool
    is_wajib: bool
    jam_override: Optional[int] = None
    # Enriched fields from relationships
    mapel_nama: Optional[str] = None
    kode_mapel: Optional[str] = None
    kelompok: Optional[str] = None
