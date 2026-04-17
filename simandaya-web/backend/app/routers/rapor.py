from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.dependencies import require_role
from app.dto.rapor.rapor_dto import (
    GuruRaporContextResponseDTO,
    OverrideNilaiDTO,
    RaporEditorResponseDTO,
    RaporListItemDTO,
    RaporNilaiResponseDTO,
    RaporResponseDTO,
    SaveRaporEditorDTO,
    UpdateRaporDTO,
)
from app.enums import UserType
from app.models.user import User
from app.services.rapor_service import RaporService

router = APIRouter(prefix="/api/v1/rapor")
teacher_router = APIRouter(tags=["Admin + Guru - Rapor"])
student_router = APIRouter(tags=["Siswa - Rapor"])


@teacher_router.get(
    "/guru/context",
    response_model=GuruRaporContextResponseDTO,
    summary="Get Guru Rapor Context (Tahun Ajaran-Semester-Kelas)",
)
async def get_guru_rapor_context(
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> GuruRaporContextResponseDTO:
    service = RaporService(db)
    return await service.get_guru_rapor_context(current_user)


@teacher_router.get(
    "/kelas/{kelas_id}",
    response_model=list[RaporListItemDTO],
    summary="List Rapor by Class",
)
async def list_rapor_by_kelas(
    kelas_id: UUID,
    semester_id: UUID = Query(...),
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> list[RaporListItemDTO]:
    service = RaporService(db)
    return await service.list_rapor_by_kelas(kelas_id, semester_id, current_user)


@teacher_router.get(
    "/editor",
    response_model=RaporEditorResponseDTO,
    summary="Open Rapor Editor (Prefilled) for One Student",
)
async def get_rapor_editor(
    kelas_id: UUID = Query(...),
    semester_id: UUID = Query(...),
    siswa_id: UUID = Query(...),
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> RaporEditorResponseDTO:
    service = RaporService(db)
    return await service.get_rapor_editor(
        kelas_id=kelas_id,
        semester_id=semester_id,
        siswa_id=siswa_id,
        current_user=current_user,
    )


@teacher_router.put(
    "/editor/{rapor_id}",
    response_model=RaporEditorResponseDTO,
    summary="Save Draft Rapor Editor",
)
async def save_rapor_editor(
    rapor_id: UUID,
    request: SaveRaporEditorDTO,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> RaporEditorResponseDTO:
    service = RaporService(db)
    return await service.save_rapor_editor(rapor_id, request, current_user)


@student_router.get(
    "/my-rapor",
    response_model=RaporResponseDTO,
    summary="Get My Rapor (Student)",
)
async def get_my_rapor(
    semester_id: UUID | None = Query(default=None),
    semester_ke: int | None = Query(default=None, ge=1, le=6),
    current_user: User = Depends(require_role(UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> RaporResponseDTO:
    service = RaporService(db)
    return await service.get_my_rapor(semester_id, semester_ke, current_user)


@teacher_router.get(
    "/{rapor_id}",
    response_model=RaporResponseDTO,
    summary="Get Full Rapor",
)
async def get_rapor(
    rapor_id: UUID,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> RaporResponseDTO:
    service = RaporService(db)
    return await service.get_rapor(rapor_id, current_user)


@teacher_router.patch(
    "/{rapor_id}",
    response_model=RaporResponseDTO,
    summary="Update Rapor Notes",
)
async def update_rapor(
    rapor_id: UUID,
    request: UpdateRaporDTO,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> RaporResponseDTO:
    service = RaporService(db)
    return await service.update_rapor(rapor_id, request, current_user)


@teacher_router.post(
    "/{rapor_id}/publish",
    response_model=RaporResponseDTO,
    summary="Publish Single Rapor",
)
async def publish_rapor(
    rapor_id: UUID,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> RaporResponseDTO:
    service = RaporService(db)
    return await service.publish_rapor(rapor_id, current_user)


@teacher_router.post(
    "/{rapor_id}/unpublish",
    response_model=RaporResponseDTO,
    summary="Unpublish Single Rapor",
)
async def unpublish_rapor(
    rapor_id: UUID,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> RaporResponseDTO:
    service = RaporService(db)
    return await service.unpublish_rapor(rapor_id, current_user)


@teacher_router.patch(
    "/rapor-nilai/{rapor_nilai_id}",
    response_model=RaporNilaiResponseDTO,
    summary="Override Grade Manually",
)
async def override_nilai(
    rapor_nilai_id: UUID,
    request: OverrideNilaiDTO,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> RaporNilaiResponseDTO:
    service = RaporService(db)
    return await service.override_nilai(rapor_nilai_id, request, current_user)


@teacher_router.post(
    "/{rapor_id}/recalculate",
    response_model=RaporResponseDTO,
    summary="Recalculate Grades from Raw Data",
)
async def recalculate_rapor(
    rapor_id: UUID,
    current_user: User = Depends(require_role(UserType.guru, UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> RaporResponseDTO:
    service = RaporService(db)
    return await service.recalculate_rapor(rapor_id, current_user)


router.include_router(student_router)
router.include_router(teacher_router)
