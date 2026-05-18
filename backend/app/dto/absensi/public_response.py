from typing import Optional
from datetime import date
from pydantic import BaseModel
from uuid import UUID
from app.enums import StatusAbsensi
from app.utils.wib_datetime import WibDatetime


class PublicAbsensiDTO(BaseModel):
    absensi_id: UUID
    nama_siswa: str
    kelas: Optional[str]
    tanggal: date
    time_in: Optional[WibDatetime]
    time_out: Optional[WibDatetime]
    status: StatusAbsensi


class PublicIzinKeluarDTO(BaseModel):
    izin_id: UUID
    nama_siswa: str
    kelas: Optional[str]
    created_at: WibDatetime
    keterangan: str
    perkiraan_kembali: Optional[WibDatetime]
