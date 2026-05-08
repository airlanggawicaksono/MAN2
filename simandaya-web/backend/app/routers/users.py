from __future__ import annotations
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import StatusSiswa, UserType
from app.models.user import User
from app.services.userMan_service import (
    StudentUserManagementService,
    TeacherUserManagementService,
    UserManagementService,
)
from app.dto.userMan.userman_request import (
    CreateStudentRequestDTO,
    UpdateStudentRequestDTO,
    UpdateGuruRequestDTO,
)
from app.dto.userMan.userman_response import (
    BulkImportStudentResultDTO,
    StudentProfileResponseDTO,
    GuruProfileResponseDTO,
    PaginatedStudentsResponse,
    PaginatedTeachersResponse,
    PaginatedPublicCivitasResponse,
    MessageResponseDTO,
)
from app.dto.struktural.assignment_dto import (
    AssignStructuralRoleDTO,
    GuruStructuralAssignmentDTO,
    StructuralRoleRefDTO,
)

router = APIRouter(prefix="/api/v1/users")
student_router = APIRouter(prefix="/students", tags=["Admin + Siswa - Users"])
teacher_router = APIRouter(prefix="/teachers", tags=["Admin + Guru - Users"])
teacher_misc_router = APIRouter(tags=["Admin - Users (Structural)"])
public_router = APIRouter(tags=["Public - Users"])


def get_student_user_service(
    db: AsyncSession = Depends(get_db),
) -> StudentUserManagementService:
    return UserManagementService(db).students


def get_teacher_user_service(
    db: AsyncSession = Depends(get_db),
) -> TeacherUserManagementService:
    return UserManagementService(db).teachers


# ── Public Civitas Endpoint ─────────────────────────────────────────────────


@public_router.get(
    "/civitas",
    response_model=PaginatedPublicCivitasResponse,
    summary="List Public Civitas",
    description="List civitas (teachers/staff) with public fields (No auth required).",
)
async def list_public_civitas(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> PaginatedPublicCivitasResponse:
    return await service.list_public_civitas(skip=skip, limit=limit, search=search)


# ── Student Endpoints ────────────────────────────────────────────────────────


@student_router.post(
    "",
    response_model=StudentProfileResponseDTO,
    status_code=201,
    summary="Create Student",
    description="Create a new student with a pending user account (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def create_student(
    request: CreateStudentRequestDTO,
    service: StudentUserManagementService = Depends(get_student_user_service),
) -> StudentProfileResponseDTO:
    return await service.create_student(request)


@student_router.post(
    "/import",
    response_model=BulkImportStudentResultDTO,
    summary="Bulk Import Students",
    description="Bulk import students from a JSON list (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def bulk_import_students(
    students: list[CreateStudentRequestDTO],
    service: StudentUserManagementService = Depends(get_student_user_service),
) -> BulkImportStudentResultDTO:
    return await service.bulk_create_students(students)


@student_router.get(
    "",
    response_model=PaginatedStudentsResponse,
    summary="List Students",
    description="List student profiles with pagination (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def list_students(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=30, ge=1, le=100, description="Max records to return (1-100)"),
    search: Optional[str] = Query(
        default=None,
        description="Search across NISN/NIM (username), nama, kelas, kontak, tempat_lahir",
    ),
    status_siswa: Optional[StatusSiswa] = Query(
        default=None,
        description="Filter by student status (Aktif, Non-Aktif, Lulus)",
    ),
    service: StudentUserManagementService = Depends(get_student_user_service),
) -> PaginatedStudentsResponse:
    return await service.list_students(skip=skip, limit=limit, search=search, status_siswa=status_siswa)


@student_router.get(
    "/{siswa_id}",
    response_model=StudentProfileResponseDTO,
    summary="Get Student",
    description="Get a student profile by ID (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def get_student(
    siswa_id: UUID,
    service: StudentUserManagementService = Depends(get_student_user_service),
) -> StudentProfileResponseDTO:
    return await service.get_student(siswa_id)


@student_router.patch(
    "/{siswa_id}",
    response_model=StudentProfileResponseDTO,
    summary="Update Student",
    description="Partial update a student profile (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def update_student(
    siswa_id: UUID,
    request: UpdateStudentRequestDTO,
    service: StudentUserManagementService = Depends(get_student_user_service),
) -> StudentProfileResponseDTO:
    return await service.update_student(siswa_id, request)


@student_router.delete(
    "/{siswa_id}",
    response_model=MessageResponseDTO,
    summary="Delete Student",
    description="Delete a student and their user account (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def delete_student(
    siswa_id: UUID,
    service: StudentUserManagementService = Depends(get_student_user_service),
) -> MessageResponseDTO:
    return await service.delete_student(siswa_id)


# ── Teacher Endpoints ────────────────────────────────────────────────────────


@teacher_router.get(
    "",
    response_model=PaginatedTeachersResponse,
    summary="List Teachers",
    description="List teacher profiles with pagination and search (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def list_teachers(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=30, ge=1, le=100, description="Max records to return (1-100)"),
    search: Optional[str] = Query(
        default=None, description="Search across nip, nama, nik, kontak, mapel, tempat_lahir"
    ),
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> PaginatedTeachersResponse:
    return await service.list_teachers(skip=skip, limit=limit, search=search)


@teacher_router.get(
    "/{guru_id}",
    response_model=GuruProfileResponseDTO,
    summary="Get Teacher",
    description="Get a teacher profile by ID (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def get_teacher(
    guru_id: UUID,
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> GuruProfileResponseDTO:
    return await service.get_teacher(guru_id)


@teacher_router.patch(
    "/{guru_id}",
    response_model=GuruProfileResponseDTO,
    summary="Update Teacher",
    description="Partial update a teacher profile (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def update_teacher(
    guru_id: UUID,
    request: UpdateGuruRequestDTO,
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> GuruProfileResponseDTO:
    return await service.update_teacher(guru_id, request)


@teacher_router.delete(
    "/{guru_id}",
    response_model=MessageResponseDTO,
    summary="Delete Teacher",
    description="Delete a teacher and their user account (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def delete_teacher(
    guru_id: UUID,
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> MessageResponseDTO:
    return await service.delete_teacher(guru_id)


# ── Structural Role Endpoints ───────────────────────────────────────────────


@teacher_misc_router.get(
    "/structural-role-catalog",
    response_model=list[StructuralRoleRefDTO],
    summary="List Structural Role Catalog",
    description="List dynamic structural role catalog (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def list_structural_role_catalog(
    include_inactive: bool = Query(default=False),
    available_only: bool = Query(default=False),
    for_user_id: UUID | None = Query(default=None),
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> list[StructuralRoleRefDTO]:
    return await service.list_structural_role_catalog(
        include_inactive=include_inactive,
        available_only=available_only,
        for_user_id=for_user_id,
    )


@teacher_misc_router.post(
    "/structural-assignments",
    response_model=GuruStructuralAssignmentDTO,
    status_code=201,
    summary="Assign Structural Role to Teacher",
    description="Assign one structural role to a teacher user (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def assign_structural_role(
    request: AssignStructuralRoleDTO,
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> GuruStructuralAssignmentDTO:
    return await service.assign_structural_role(request)


@teacher_misc_router.get(
    "/teachers/{user_id}/structural-assignments",
    response_model=list[GuruStructuralAssignmentDTO],
    summary="List Teacher Structural Assignments",
    description="List one teacher's structural assignments (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def list_teacher_structural_assignments(
    user_id: UUID,
    active_only: bool = Query(default=False),
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> list[GuruStructuralAssignmentDTO]:
    return await service.list_teacher_structural_assignments(user_id=user_id, active_only=active_only)


@teacher_misc_router.delete(
    "/structural-assignments/{assignment_id}",
    response_model=MessageResponseDTO,
    summary="Deactivate Structural Assignment",
    description="Deactivate one structural assignment (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def deactivate_structural_assignment(
    assignment_id: UUID,
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> MessageResponseDTO:
    return await service.deactivate_structural_assignment(assignment_id)


router.include_router(public_router)
router.include_router(student_router)
router.include_router(teacher_router)
router.include_router(teacher_misc_router)

