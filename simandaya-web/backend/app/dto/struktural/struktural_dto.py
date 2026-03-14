from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

from app.enums import StructuralRole, UserType


# yg dibutuhkan nama_lengkap , structural_role,nip
class GetStructuralRoleResponseDTO(BaseModel):
    guru_id: UUID
    nip: Optional[str]
    nama_lengkap: str
    structural_role: StructuralRole
    user_type: UserType


class GetStructuralRoleResponseListDTO(BaseModel):
    list_of_struct: List[GetStructuralRoleResponseDTO]
