from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID


class CreateGuruMapelDTO(BaseModel):
    user_id: UUID = Field(..., description="Guru user_id")
    mapel_id: UUID = Field(..., description="Mata pelajaran ID")
    kelas_id: UUID = Field(..., description="Kelas ID")
    tahun_ajaran_id: UUID = Field(..., description="Academic year ID")


class UpdateGuruMapelDTO(BaseModel):
    user_id: Optional[UUID] = Field(default=None, description="Guru user_id")
    mapel_id: Optional[UUID] = Field(default=None, description="Mata pelajaran ID")
    kelas_id: Optional[UUID] = Field(default=None, description="Kelas ID")


class GuruMapelResponseDTO(BaseModel):
    guru_mapel_id: UUID
    user_id: UUID
    mapel_id: UUID
    kelas_id: UUID
    tahun_ajaran_id: UUID
    guru_nama: Optional[str] = None
    mapel_nama: Optional[str] = None
    kelas_nama: Optional[str] = None


class MessageResponseDTO(BaseModel):
    message: str
