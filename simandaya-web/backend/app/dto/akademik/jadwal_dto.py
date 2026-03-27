from typing import Optional
from datetime import time
from pydantic import BaseModel, Field
from uuid import UUID
from app.enums import HariSekolah


class CreateJadwalDTO(BaseModel):
    semester_id: UUID = Field(...)
    kelas_id: UUID = Field(...)
    mapel_id: UUID = Field(...)
    guru_user_id: UUID = Field(..., description="Guru user_id")
    hari: HariSekolah = Field(...)
    slot_waktu_id: UUID = Field(...)


class UpdateJadwalDTO(BaseModel):
    mapel_id: Optional[UUID] = None
    guru_user_id: Optional[UUID] = None
    hari: Optional[HariSekolah] = None
    slot_waktu_id: Optional[UUID] = None


class JadwalResponseDTO(BaseModel):
    jadwal_id: UUID
    semester_id: UUID
    kelas_id: UUID
    mapel_id: UUID
    guru_user_id: UUID
    hari: HariSekolah
    slot_waktu_id: UUID
    mapel_nama: Optional[str] = None
    nama_kelas: Optional[str] = None
    guru_nama: Optional[str] = None
    jam_mulai: Optional[time] = None
    jam_selesai: Optional[time] = None


class MessageResponseDTO(BaseModel):
    message: str
