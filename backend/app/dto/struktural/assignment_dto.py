from datetime import date
from uuid import UUID

from pydantic import BaseModel
from app.enums import StructuralRole


class StructuralRoleRefDTO(BaseModel):
    role_id: UUID | None = None
    code: str
    name: str
    is_active: bool

    model_config = {"from_attributes": True}


class AssignStructuralRoleDTO(BaseModel):
    user_id: UUID
    structural_role: StructuralRole
    kelas_id: UUID | None = None
    tahun_ajaran_id: UUID | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool = True


class GuruStructuralAssignmentDTO(BaseModel):
    assignment_id: UUID
    user_id: UUID
    role_id: UUID
    structural_role: StructuralRole | None = None
    role_code: str | None = None
    role_name: str | None = None
    tahun_ajaran_id: UUID | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool

    model_config = {"from_attributes": True}
