from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.models.user import User
from app.services.nilai_service import NilaiService
from app.services.siswa_overview_service import SiswaOverviewService
from app.dto.penilaian.nilai_dto import (
    CreateNilaiDTO, BulkCreateNilaiDTO, UpdateNilaiDTO,
    NilaiResponseDTO, BulkNilaiResponseDTO, MessageResponseDTO, NilaiByMapelDTO,
)
from app.dto.penilaian.siswa_overview_dto import SiswaOverviewResponseDTO

router = APIRouter(prefix="/api/v1/penilaian")
teacher_router = APIRouter(tags=["Admin + Guru - Nilai"])
student_router = APIRouter(tags=["Siswa - Nilai"])


@teacher_router.post(
    "/tugas/{tugas_id}/nilai",
    response_model=NilaiResponseDTO,
    status_code=201,
    summary="Create Single Score",
)
async def create_nilai(
    tugas_id: UUID,
    request: CreateNilaiDTO,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> NilaiResponseDTO:
    service = NilaiService(db)
    return await service.create_nilai(tugas_id, request, current_user)


@teacher_router.post(
    "/tugas/{tugas_id}/nilai/bulk",
    response_model=BulkNilaiResponseDTO,
    summary="Bulk Create/Update Scores",
)
async def bulk_create_nilai(
    tugas_id: UUID,
    request: BulkCreateNilaiDTO,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> BulkNilaiResponseDTO:
    service = NilaiService(db)
    return await service.bulk_create_nilai(tugas_id, request, current_user)


@teacher_router.get(
    "/tugas/{tugas_id}/nilai",
    response_model=list[NilaiResponseDTO],
    summary="List Scores for Tugas",
)
async def list_nilai_by_tugas(
    tugas_id: UUID,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> list[NilaiResponseDTO]:
    service = NilaiService(db)
    return await service.list_nilai_by_tugas(tugas_id, current_user)


@student_router.get(
    "/siswa/overview",
    response_model=SiswaOverviewResponseDTO,
    summary="Get My Academic Overview (Rapor + Nilai + Tugas)",
)
async def get_my_academic_overview(
    semester_id: Optional[UUID] = Query(default=None),
    semester_ke: Optional[int] = Query(default=None, ge=1, le=6),
    current_user: User = Depends(require_role(UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> SiswaOverviewResponseDTO:
    service = SiswaOverviewService(db)
    return await service.get_my_overview(
        current_user=current_user,
        semester_id=semester_id,
        semester_ke=semester_ke,
    )


@student_router.get(
    "/nilai/my-scores",
    response_model=list[NilaiResponseDTO],
    summary="Get My Scores (Student)",
)
async def list_my_scores(
    semester_id: Optional[UUID] = Query(default=None),
    current_user: User = Depends(require_role(UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> list[NilaiResponseDTO]:
    service = NilaiService(db)
    return await service.list_my_scores(current_user, semester_id)


@student_router.get(
    "/nilai/my-scores/by-mapel",
    response_model=list[NilaiByMapelDTO],
    summary="Get My Scores Grouped by Subject (Student)",
)
async def list_my_scores_by_mapel(
    semester_id: Optional[UUID] = Query(default=None),
    current_user: User = Depends(require_role(UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> list[NilaiByMapelDTO]:
    service = NilaiService(db)
    return await service.list_my_scores_by_mapel(current_user, semester_id)


@teacher_router.patch(
    "/nilai/{nilai_id}",
    response_model=NilaiResponseDTO,
    summary="Update Score",
)
async def update_nilai(
    nilai_id: UUID,
    request: UpdateNilaiDTO,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> NilaiResponseDTO:
    service = NilaiService(db)
    return await service.update_nilai(nilai_id, request, current_user)


@teacher_router.delete(
    "/nilai/{nilai_id}",
    response_model=MessageResponseDTO,
    summary="Delete Score",
)
async def delete_nilai(
    nilai_id: UUID,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = NilaiService(db)
    return await service.delete_nilai(nilai_id, current_user)


router.include_router(teacher_router)
router.include_router(student_router)

