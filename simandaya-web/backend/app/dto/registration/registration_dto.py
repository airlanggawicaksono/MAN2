from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.enums import JenisKelamin


# ── Lookup responses (Step 2: NIS/NIP lookup confirms identity) ──────────────


class StudentLookupResponseDTO(BaseModel):
    siswa_id: UUID
    nis: str
    nama_lengkap: str
    kelas_jurusan: Optional[str] = None
    jenis_kelamin: Optional[JenisKelamin] = None

    model_config = {"from_attributes": True}


class TeacherLookupResponseDTO(BaseModel):
    guru_id: UUID
    nip: str
    nama_lengkap: str
    jenis_kelamin: Optional[JenisKelamin] = None

    model_config = {"from_attributes": True}


# ── Claim requests (Step 3: set credentials) ────────────────────────────────


class ClaimStudentRequestDTO(BaseModel):
    nis: str = Field(
        ..., min_length=1, max_length=50, description="NIS yang sudah didaftarkan admin"
    )
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class ClaimTeacherRequestDTO(BaseModel):
    nip: str = Field(
        ..., min_length=1, max_length=50, description="NIP yang sudah didaftarkan admin"
    )
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class ClaimResponseDTO(BaseModel):
    message: str
    username: str
    user_type: str


# ── Admin pre-register requests ─────────────────────────────────────────────


class PreRegisterStudentDTO(BaseModel):
    nis: str = Field(..., min_length=1, max_length=50)
    nama_lengkap: str = Field(..., min_length=2, max_length=225)
    dob: Optional[str] = Field(default=None, min_length=1, max_length=50)
    tempat_lahir: Optional[str] = Field(default=None, min_length=1, max_length=100)
    jenis_kelamin: Optional[JenisKelamin] = None
    alamat: Optional[str] = Field(default=None, min_length=1, max_length=500)
    nama_wali: Optional[str] = Field(default=None, min_length=2, max_length=225)
    tahun_masuk: Optional[int] = Field(default=None, ge=1900, le=2100)
    kontak: Optional[str] = Field(default=None, max_length=100)
    kewarganegaraan: Optional[str] = Field(default=None, max_length=50)


class PreRegisterTeacherDTO(BaseModel):
    nip: str = Field(..., min_length=1, max_length=50)
    nama_lengkap: str = Field(..., min_length=2, max_length=225)
    dob: Optional[str] = Field(default=None, min_length=1, max_length=50)
    tempat_lahir: Optional[str] = Field(default=None, min_length=1, max_length=100)
    jenis_kelamin: Optional[JenisKelamin] = None
    alamat: Optional[str] = Field(default=None, min_length=1, max_length=500)
    nik: Optional[str] = Field(default=None, min_length=1, max_length=20)
    tahun_masuk: Optional[int] = Field(default=None, ge=1900, le=2100)
    kontak: Optional[str] = Field(default=None, max_length=100)
    kewarganegaraan: Optional[str] = Field(default=None, max_length=50)
    mata_pelajaran: Optional[str] = Field(default=None, max_length=100)
    pendidikan_terakhir: Optional[str] = Field(default=None, max_length=100)


class PreRegisterResponseDTO(BaseModel):
    message: str
