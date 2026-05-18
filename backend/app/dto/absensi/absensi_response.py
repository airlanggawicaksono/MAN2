from typing import Optional
from datetime import date
from pydantic import BaseModel
from uuid import UUID
from app.enums import StatusAbsensi
from app.utils.wib_datetime import WibDatetime


class AbsensiResponseDTO(BaseModel):
    absensi_id: UUID
    user_id: UUID
    tanggal: date
    time_in: Optional[WibDatetime]
    time_out: Optional[WibDatetime]
    status: StatusAbsensi
    marked_by: Optional[UUID]


class IzinKeluarResponseDTO(BaseModel):
    izin_id: UUID
    user_id: UUID
    created_at: WibDatetime
    keterangan: str
    perkiraan_kembali: Optional[WibDatetime]


class MessageResponseDTO(BaseModel):
    message: str
