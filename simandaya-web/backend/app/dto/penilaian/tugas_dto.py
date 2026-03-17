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
    deadline: Optional[datetime] = Field(default=None)


class UpdateTugasDTO(BaseModel):
    judul: Optional[str] = Field(default=None, max_length=200)
    deskripsi: Optional[str] = None
    link_tugas: Optional[str] = Field(default=None, max_length=500)
    deadline: Optional[datetime] = None


class TugasResponseDTO(BaseModel):
    tugas_id: UUID
    semester_id: UUID
    kelas_id: UUID
    mapel_id: UUID
    created_by: Optional[UUID]
    jenis: JenisTugas
    judul: str
    deskripsi: Optional[str]
    link_tugas: Optional[str]
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
    submission_link: Optional[str]
    jawaban_text: Optional[str]
    submitted_at: datetime
    updated_at: datetime


class MessageResponseDTO(BaseModel):
    message: str
