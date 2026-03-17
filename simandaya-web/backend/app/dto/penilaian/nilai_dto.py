from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID


class CreateNilaiDTO(BaseModel):
    user_id: UUID = Field(..., description="Student user_id")
    nilai: float = Field(..., ge=0, le=100, description="Score 0-100")
    catatan: Optional[str] = Field(default=None, max_length=500)


class BulkCreateNilaiDTO(BaseModel):
    entries: list[CreateNilaiDTO] = Field(..., min_length=1)


class UpdateNilaiDTO(BaseModel):
    nilai: Optional[float] = Field(default=None, ge=0, le=100)
    catatan: Optional[str] = Field(default=None, max_length=500)


class NilaiResponseDTO(BaseModel):
    nilai_id: UUID
    tugas_id: UUID
    user_id: UUID
    nilai: float
    catatan: Optional[str]


class NilaiByMapelDTO(BaseModel):
    mapel_id: UUID
    mapel_nama: str
    scores: list[NilaiResponseDTO]
    average: float


class BulkNilaiResponseDTO(BaseModel):
    created_count: int
    updated_count: int
    message: str


class MessageResponseDTO(BaseModel):
    message: str
