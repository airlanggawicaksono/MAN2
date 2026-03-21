from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel
from uuid import UUID
from app.enums import StatusAbsensi


class PublicAbsensiDTO(BaseModel):
    absensi_id: UUID
    nama_siswa: str
    kelas: Optional[str]
    tanggal: date
    time_in: Optional[datetime]
    time_out: Optional[datetime]
    status: StatusAbsensi


class PublicIzinKeluarDTO(BaseModel):
    izin_id: UUID
    nama_siswa: str
    kelas: Optional[str]
    created_at: datetime
    keterangan: str
    perkiraan_kembali: Optional[datetime]
