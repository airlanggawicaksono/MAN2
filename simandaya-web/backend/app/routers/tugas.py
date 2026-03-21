from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.models.user import User
from app.services.tugas_service import TugasService
from app.dto.penilaian.tugas_dto import (
    CreateTugasDTO, UpdateTugasDTO, TugasResponseDTO, MessageResponseDTO,
    CreateTugasSubmissionDTO, UpdateTugasSubmissionDTO, TugasSubmissionResponseDTO,
)

router = APIRouter(prefix="/api/v1/penilaian")
teacher_router = APIRouter(tags=["Admin + Guru - Tugas"])
student_router = APIRouter(tags=["Siswa - Tugas"])


@teacher_router.post(
    "/tugas",
    response_model=TugasResponseDTO,
    status_code=201,
    summary="Create Assignment/Assessment",
)
async def create_tugas(
    request: CreateTugasDTO,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> TugasResponseDTO:
    service = TugasService(db)
    return await service.create_tugas(request, current_user)


@teacher_router.get(
    "/tugas/kelas/{kelas_id}",
    response_model=list[TugasResponseDTO],
    summary="List Tugas by Class",
)
async def list_tugas_by_kelas(
    kelas_id: UUID,
    semester_id: UUID = Query(...),
    mapel_id: Optional[UUID] = Query(default=None),
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> list[TugasResponseDTO]:
    service = TugasService(db)
    return await service.list_tugas_by_kelas(kelas_id, semester_id, mapel_id)


@student_router.get(
    "/tugas/my-class",
    response_model=list[TugasResponseDTO],
    summary="List My Class Tugas (Student)",
)
async def list_tugas_my_class(
    semester_id: UUID = Query(...),
    current_user: User = Depends(require_role(UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> list[TugasResponseDTO]:
    service = TugasService(db)
    return await service.list_tugas_my_class(current_user, semester_id)


@teacher_router.get(
    "/tugas/{tugas_id}",
    response_model=TugasResponseDTO,
    summary="Get Tugas by ID",
)
async def get_tugas(
    tugas_id: UUID,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin, UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> TugasResponseDTO:
    service = TugasService(db)
    return await service.get_tugas(tugas_id)


@teacher_router.patch(
    "/tugas/{tugas_id}",
    response_model=TugasResponseDTO,
    summary="Update Tugas",
)
async def update_tugas(
    tugas_id: UUID,
    request: UpdateTugasDTO,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> TugasResponseDTO:
    service = TugasService(db)
    return await service.update_tugas(tugas_id, request, current_user)


@teacher_router.delete(
    "/tugas/{tugas_id}",
    response_model=MessageResponseDTO,
    summary="Delete Tugas",
)
async def delete_tugas(
    tugas_id: UUID,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = TugasService(db)
    return await service.delete_tugas(tugas_id, current_user)


@student_router.post(
    "/tugas/{tugas_id}/submission",
    response_model=TugasSubmissionResponseDTO,
    status_code=201,
    summary="Submit Tugas (Student)",
)
async def create_my_submission(
    tugas_id: UUID,
    request: CreateTugasSubmissionDTO,
    current_user: User = Depends(require_role(UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> TugasSubmissionResponseDTO:
    service = TugasService(db)
    return await service.create_my_submission(tugas_id, request, current_user)


@student_router.put(
    "/tugas/{tugas_id}/submission",
    response_model=TugasSubmissionResponseDTO,
    summary="Update Tugas Submission (Student)",
)
async def update_my_submission(
    tugas_id: UUID,
    request: UpdateTugasSubmissionDTO,
    current_user: User = Depends(require_role(UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> TugasSubmissionResponseDTO:
    service = TugasService(db)
    return await service.update_my_submission(tugas_id, request, current_user)


router.include_router(teacher_router)
router.include_router(student_router)

