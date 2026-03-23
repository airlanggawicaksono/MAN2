from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID
from app.enums import KelompokMapel


class CreateMapelDTO(BaseModel):
    kode_mapel: str = Field(..., min_length=1, max_length=20, description="e.g. MTK, FQH")
    nama_mapel: str = Field(..., min_length=1, max_length=100)
    kelompok: KelompokMapel = Field(...)
    is_active: bool = Field(default=True)


class UpdateMapelDTO(BaseModel):
    kode_mapel: Optional[str] = Field(default=None, max_length=20)
    nama_mapel: Optional[str] = Field(default=None, max_length=100)
    kelompok: Optional[KelompokMapel] = None
    is_active: Optional[bool] = None


class MapelResponseDTO(BaseModel):
    mapel_id: UUID
    kode_mapel: str
    nama_mapel: str
    kelompok: KelompokMapel
    is_active: bool
