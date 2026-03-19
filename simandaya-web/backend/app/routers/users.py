from __future__ import annotations
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.models.user import User
from app.services.userMan_service import (
    StudentUserManagementService,
    TeacherUserManagementService,
    UserManagementService,
)
from app.dto.userMan.userman_request import (
    UpdateStudentRequestDTO,
    UpdateGuruRequestDTO,
)
from app.dto.userMan.userman_response import (
    StudentProfileResponseDTO,
    GuruProfileResponseDTO,
    PaginatedStudentsResponse,
    PaginatedTeachersResponse,
    PaginatedPublicCivitasResponse,
    MessageResponseDTO,
)
from app.services.registration_service import RegistrationService
from app.dto.registration.registration_dto import (
    PreRegisterStudentDTO,
    PreRegisterTeacherDTO,
    PreRegisterResponseDTO,
)
from app.dto.struktural.assignment_dto import (
    AssignStructuralRoleDTO,
    GuruStructuralAssignmentDTO,
    StructuralRoleRefDTO,
)

router = APIRouter(prefix="/api/v1/users")
student_router = APIRouter(prefix="/students", tags=["User Management - Students"])
teacher_router = APIRouter(prefix="/teachers", tags=["User Management - Teachers"])
teacher_misc_router = APIRouter(tags=["User Management - Teachers"])
public_router = APIRouter(tags=["User Management - Public"])


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
        default=None, description="Search across nis, nama, nik, kelas, kontak, tempat_lahir"
    ),
    service: StudentUserManagementService = Depends(get_student_user_service),
) -> PaginatedStudentsResponse:
    return await service.list_students(skip=skip, limit=limit, search=search)


@student_router.get(
    "/me",
    response_model=StudentProfileResponseDTO,
    summary="Get My Student Profile",
)
async def get_my_student_profile(
    current_user: User = Depends(require_role(UserType.siswa)),
    service: StudentUserManagementService = Depends(get_student_user_service),
) -> StudentProfileResponseDTO:
    return await service.get_student_by_user_id(current_user.user_id)


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
    "/me",
    response_model=GuruProfileResponseDTO,
    summary="Get My Teacher Profile",
)
async def get_my_teacher_profile(
    current_user: User = Depends(require_role(UserType.guru)),
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> GuruProfileResponseDTO:
    return await service.get_teacher_by_user_id(current_user.user_id)


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


# ── Pre-Register Endpoints ──────────────────────────────────────────────────


@student_router.post(
    "/pre-register",
    response_model=PreRegisterResponseDTO,
    status_code=201,
    summary="Pre-Register Student",
    description="Create a PENDING student entry (Admin only). Student completes registration via /register.",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def pre_register_student(
    request: PreRegisterStudentDTO,
    db: AsyncSession = Depends(get_db),
) -> PreRegisterResponseDTO:
    service = RegistrationService(db)
    return await service.pre_register_student(request)


@teacher_router.post(
    "/pre-register",
    response_model=PreRegisterResponseDTO,
    status_code=201,
    summary="Pre-Register Teacher",
    description="Create a PENDING teacher entry (Admin only). Teacher completes registration via /register.",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def pre_register_teacher(
    request: PreRegisterTeacherDTO,
    db: AsyncSession = Depends(get_db),
) -> PreRegisterResponseDTO:
    service = RegistrationService(db)
    return await service.pre_register_teacher(request)


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
    service: TeacherUserManagementService = Depends(get_teacher_user_service),
) -> list[StructuralRoleRefDTO]:
    return await service.list_structural_role_catalog(include_inactive=include_inactive)


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
