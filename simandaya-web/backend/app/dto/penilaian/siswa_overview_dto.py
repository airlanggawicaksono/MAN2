from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.dto.rapor.rapor_dto import RaporResponseDTO


class SiswaOverviewTaskDetailDTO(BaseModel):
    tugas_id: UUID
    judul_tugas: str
    jenis_tugas: str
    nilai: Optional[float] = None
    nilai_disembunyikan: bool = False
    catatan: Optional[str] = None
    deadline: Optional[datetime] = None
    link_tugas: Optional[str] = None
    link_submission: Optional[str] = None


class SiswaOverviewMapelDTO(BaseModel):
    mapel_id: UUID
    mapel_nama: str
    nilai_akhir: float
    nilai_sumber: float
    nilai_override: Optional[float] = None
    is_manual_override: bool = False
    catatan: Optional[str] = None
    komponen_nilai: list[dict] = Field(default_factory=list)
    tugas_details: list[SiswaOverviewTaskDetailDTO] = Field(default_factory=list)


class SiswaOverviewTugasItemDTO(BaseModel):
    tugas_id: UUID
    semester_id: UUID
    kelas_id: UUID
    mapel_id: UUID
    mapel_nama: Optional[str] = None
    guru_pengajar: Optional[str] = None
    jenis: str
    judul: str
    deskripsi: Optional[str] = None
    deadline: Optional[datetime] = None
    created_at: datetime
    link_tugas: Optional[str] = None
    link_submission: Optional[str] = None
    is_submitted: bool = False
    submitted_at: Optional[datetime] = None
    is_late_submission: bool = False


class SiswaOverviewResponseDTO(BaseModel):
    semester_id: UUID
    semester_ke: Optional[int] = None
    kelas_id: UUID
    rapor_published: bool = False
    rapor: Optional[RaporResponseDTO] = None
    nilai_mapel: list[SiswaOverviewMapelDTO] = Field(default_factory=list)
    tugas_list: list[SiswaOverviewTugasItemDTO] = Field(default_factory=list)
