from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel
from uuid import UUID
from app.enums import StatusAbsensi


class AbsensiResponseDTO(BaseModel):
    absensi_id: UUID
    user_id: UUID
    tanggal: date
    time_in: Optional[datetime]
    time_out: Optional[datetime]
    status: StatusAbsensi
    marked_by: Optional[UUID]


class IzinKeluarResponseDTO(BaseModel):
    izin_id: UUID
    user_id: UUID
    created_at: datetime
    keterangan: str
    perkiraan_kembali: Optional[datetime]


class MessageResponseDTO(BaseModel):
    message: str
