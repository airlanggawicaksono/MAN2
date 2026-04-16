from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from app.enums import JenisTugas


class CreateTugasDTO(BaseModel):
    semester_id: UUID = Field(...)
    kelas_id: UUID = Field(...)
    mapel_id: UUID = Field(...)
    jenis: JenisTugas = Field(...)
    judul: str = Field(..., min_length=1, max_length=200)
    deskripsi: Optional[str] = Field(default=None)
    link_tugas: Optional[str] = Field(default=None, max_length=500)
    link_submission: Optional[str] = Field(default=None, max_length=500)
    deadline: Optional[datetime] = Field(default=None)
    is_published_to_students: bool = Field(default=True)
    is_nilai_published_to_students: bool = Field(default=True)


class UpdateTugasDTO(BaseModel):
    judul: Optional[str] = Field(default=None, max_length=200)
    deskripsi: Optional[str] = None
    link_tugas: Optional[str] = Field(default=None, max_length=500)
    link_submission: Optional[str] = Field(default=None, max_length=500)
    deadline: Optional[datetime] = None
    is_published_to_students: Optional[bool] = None
    is_nilai_published_to_students: Optional[bool] = None


class TugasResponseDTO(BaseModel):
    tugas_id: UUID
    semester_id: UUID
    kelas_id: UUID
    mapel_id: UUID
    created_by: Optional[UUID]
    jenis: JenisTugas
    judul: str
    deskripsi: Optional[str]
    kelas_nama: Optional[str] = None
    mapel_nama: Optional[str] = None
    guru_pengajar: Optional[str] = None
    link_tugas: Optional[str]
    link_submission: Optional[str]
    is_archived_context: bool
    is_published_to_students: bool
    is_nilai_published_to_students: bool
    deadline: Optional[datetime]
    created_at: datetime


class CreateTugasSubmissionDTO(BaseModel):
    submission_link: Optional[str] = Field(default=None, max_length=500)
    jawaban_text: Optional[str] = Field(default=None)


class UpdateTugasSubmissionDTO(BaseModel):
    submission_link: Optional[str] = Field(default=None, max_length=500)
    jawaban_text: Optional[str] = Field(default=None)


class TugasSubmissionResponseDTO(BaseModel):
    submission_id: UUID
    tugas_id: UUID
    user_id: UUID
    student_name: Optional[str] = None
    student_nis: Optional[str] = None
    submission_link: Optional[str]
    jawaban_text: Optional[str]
    is_late: bool = False
    submitted_at: datetime
    updated_at: datetime


class MessageResponseDTO(BaseModel):
    message: str
