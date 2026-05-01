from typing import Literal, Optional
from pydantic import BaseModel, Field
from uuid import UUID
from app.enums import (
    StatusSiswa,
    StatusGuru,
    JenisKelamin,
)
from app.dto.struktural.assignment_dto import GuruStructuralAssignmentDTO


class StudentProfileResponseDTO(BaseModel):
    siswa_id: UUID
    user_id: UUID
    nisn: Optional[str] = None
    nama_lengkap: str
    dob: Optional[str] = None
    tempat_lahir: Optional[str] = None
    jenis_kelamin: Optional[JenisKelamin] = None
    alamat: Optional[str] = None
    nama_wali: Optional[str] = None
    kelas_jurusan: Optional[str] = None
    kelas_nama: Optional[str] = None
    tahun_masuk: Optional[int] = None
    status_siswa: StatusSiswa
    semester_aktif_tipe: Optional[str] = None
    semester_ke: Optional[int] = None
    kontak: Optional[str] = None
    kewarganegaraan: str
    card_no: Optional[str] = None
    is_active: bool = False


class GuruProfileResponseDTO(BaseModel):
    guru_id: UUID
    user_id: UUID
    nip: Optional[str] = None
    nama_lengkap: str
    dob: Optional[str] = None
    tempat_lahir: Optional[str] = None
    jenis_kelamin: Optional[JenisKelamin] = None
    alamat: Optional[str] = None
    nik: Optional[str] = None
    tahun_masuk: Optional[int] = None
    status_guru: StatusGuru
    kontak: Optional[str] = None
    kewarganegaraan: str
    structural_assignments: list[GuruStructuralAssignmentDTO] = Field(default_factory=list)
    mata_pelajaran: Optional[str]
    pendidikan_terakhir: Optional[str]
    is_active: bool = False


class PublicCivitasResponseDTO(BaseModel):
    nama: str
    nip: Optional[str] = None
    nik: Optional[str] = None
    jabatan_struktural: list[str] = Field(default_factory=list)
    matapelajaran: Optional[str] = None
    kontak: Optional[str] = None


class PaginatedStudentsResponse(BaseModel):
    items: list[StudentProfileResponseDTO]
    total: int
    skip: int
    limit: int


class PaginatedTeachersResponse(BaseModel):
    items: list[GuruProfileResponseDTO]
    total: int
    skip: int
    limit: int


class PaginatedPublicCivitasResponse(BaseModel):
    items: list[PublicCivitasResponseDTO]
    total: int
    skip: int
    limit: int


class MessageResponseDTO(BaseModel):
    message: str


class BulkImportStudentResultItem(BaseModel):
    row: int
    nama_lengkap: str
    nisn: Optional[str] = None
    status: Literal["created", "skipped", "error"]
    detail: Optional[str] = None


class BulkImportStudentResultDTO(BaseModel):
    created: int
    skipped: int
    errors: int
    items: list[BulkImportStudentResultItem]
