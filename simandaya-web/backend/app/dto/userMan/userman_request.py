from typing import Optional
from pydantic import BaseModel, Field
from app.enums import (
    JenisKelamin,
    StatusSiswa,
    StatusGuru,
)


# ── Student ──────────────────────────────────────────────────────────────────


class CreateStudentRequestDTO(BaseModel):
    """Request DTO for creating a new student with user account (Admin only)"""

    nis: Optional[str] = Field(default=None, min_length=1, max_length=50)
    nama_lengkap: str = Field(min_length=2, max_length=225)
    dob: Optional[str] = Field(default=None, max_length=50)
    tempat_lahir: Optional[str] = Field(default=None, max_length=100)
    jenis_kelamin: Optional[JenisKelamin] = None
    alamat: Optional[str] = Field(default=None, max_length=500)
    nama_wali: Optional[str] = Field(default=None, max_length=225)
    kelas_jurusan: Optional[str] = Field(default=None, max_length=100)
    tahun_masuk: Optional[int] = Field(default=None, ge=1900, le=2100)
    status_siswa: StatusSiswa = Field(default=StatusSiswa.aktif)
    kontak: Optional[str] = Field(default=None, max_length=100)
    kewarganegaraan: str = Field(default="Indonesia", max_length=50)
    card_no: Optional[str] = Field(default=None, min_length=1, max_length=50)


class UpdateStudentRequestDTO(BaseModel):
    """Request DTO for partial update of a student profile (Admin only)"""

    nis: Optional[str] = Field(default=None, min_length=1, max_length=50)
    nama_lengkap: Optional[str] = Field(default=None, min_length=2, max_length=225)
    dob: Optional[str] = Field(default=None, min_length=1, max_length=50)
    tempat_lahir: Optional[str] = Field(default=None, max_length=100)
    jenis_kelamin: Optional[JenisKelamin] = None
    alamat: Optional[str] = Field(default=None, max_length=500)
    nama_wali: Optional[str] = Field(default=None, min_length=2, max_length=225)
    kelas_jurusan: Optional[str] = Field(default=None, max_length=100)
    tahun_masuk: Optional[int] = Field(default=None, ge=1900, le=2100)
    status_siswa: Optional[StatusSiswa] = None
    kontak: Optional[str] = Field(default=None, max_length=100)
    kewarganegaraan: Optional[str] = Field(default=None, max_length=50)
    card_no: Optional[str] = Field(default=None, min_length=1, max_length=50)


# ── Guru ─────────────────────────────────────────────────────────────────────


class UpdateGuruRequestDTO(BaseModel):
    """Request DTO for partial update of a teacher profile (Admin only)"""

    nip: Optional[str] = Field(default=None, min_length=1, max_length=50)
    nama_lengkap: Optional[str] = Field(default=None, min_length=2, max_length=225)
    dob: Optional[str] = Field(default=None, min_length=1, max_length=50)
    tempat_lahir: Optional[str] = Field(default=None, max_length=100)
    jenis_kelamin: Optional[JenisKelamin] = None
    alamat: Optional[str] = Field(default=None, max_length=500)
    nik: Optional[str] = Field(default=None, max_length=20)
    tahun_masuk: Optional[int] = Field(default=None, ge=1900, le=2100)
    status_guru: Optional[StatusGuru] = None
    kontak: Optional[str] = Field(default=None, max_length=100)
    kewarganegaraan: Optional[str] = Field(default=None, max_length=50)
    mata_pelajaran: Optional[str] = Field(default=None, max_length=100)
    pendidikan_terakhir: Optional[str] = Field(default=None, max_length=100)
