from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from app.enums import (
    StatusSiswa,
    StatusGuru,
    JenisKelamin,
    StructuralRole,
)


class StudentProfileResponseDTO(BaseModel):
    siswa_id: UUID
    nis: Optional[str] = None
    nama_lengkap: str
    dob: Optional[str] = None
    tempat_lahir: Optional[str] = None
    jenis_kelamin: Optional[JenisKelamin] = None
    alamat: Optional[str] = None
    nama_wali: Optional[str] = None
    nik: Optional[str] = None
    kelas_jurusan: Optional[str] = None
    tahun_masuk: Optional[int] = None
    status_siswa: StatusSiswa
    kontak: Optional[str] = None
    kewarganegaraan: str
    is_active: bool = False


class GuruProfileResponseDTO(BaseModel):
    guru_id: UUID
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
    structural_role: StructuralRole
    mata_pelajaran: Optional[str]
    pendidikan_terakhir: Optional[str]
    is_active: bool = False


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


class MessageResponseDTO(BaseModel):
    message: str
