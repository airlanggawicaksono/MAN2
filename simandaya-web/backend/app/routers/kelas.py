from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.models.user import User
from app.services.kelas_service import KelasService
from app.dto.akademik.kelas_dto import (
    CreateKelasDTO,
    UpdateKelasDTO,
    KelasResponseDTO,
    AssignSiswaDTO,
    SiswaKelasResponseDTO,
    PromoteStudentsDTO,
    PromoteResultDTO,
    MessageResponseDTO,
)

router = APIRouter(prefix="/api/v1/akademik")
admin_router = APIRouter(tags=["Admin - Kelas"])
guru_router = APIRouter(tags=["Guru - Kelas"])
student_router = APIRouter(tags=["Siswa - Kelas"])


# ── Kelas CRUD ───────────────────────────────────────────────────────────────


@admin_router.post(
    "/kelas",
    response_model=KelasResponseDTO,
    status_code=201,
    summary="Create Class Group",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def create_kelas(
    request: CreateKelasDTO,
    db: AsyncSession = Depends(get_db),
) -> KelasResponseDTO:
    service = KelasService(db)
    return await service.create_kelas(request)


@guru_router.get(
    "/kelas",
    response_model=list[KelasResponseDTO],
    summary="List Classes",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru))],
)
async def list_kelas(
    db: AsyncSession = Depends(get_db),
) -> list[KelasResponseDTO]:
    service = KelasService(db)
    return await service.list_kelas()


@student_router.get(
    "/kelas/my-kelas",
    response_model=KelasResponseDTO,
    summary="Get My Class (Student)",
)
async def get_my_kelas(
    current_user: User = Depends(require_role(UserType.siswa)),
    db: AsyncSession = Depends(get_db),
) -> KelasResponseDTO:
    service = KelasService(db)
    return await service.get_student_kelas(current_user.user_id)


@guru_router.get(
    "/kelas/tahun-ajaran/{tahun_ajaran_id}",
    response_model=list[KelasResponseDTO],
    summary="List Classes by Academic Year",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru))],
)
async def list_kelas_by_tahun_ajaran(
    tahun_ajaran_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[KelasResponseDTO]:
    service = KelasService(db)
    return await service.list_kelas_by_tahun_ajaran(tahun_ajaran_id)


@guru_router.get(
    "/kelas/{kelas_id}",
    response_model=KelasResponseDTO,
    summary="Get Class",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru))],
)
async def get_kelas(
    kelas_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> KelasResponseDTO:
    service = KelasService(db)
    return await service.get_kelas(kelas_id)


@admin_router.patch(
    "/kelas/{kelas_id}",
    response_model=KelasResponseDTO,
    summary="Update Class",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def update_kelas(
    kelas_id: UUID,
    request: UpdateKelasDTO,
    db: AsyncSession = Depends(get_db),
) -> KelasResponseDTO:
    service = KelasService(db)
    return await service.update_kelas(kelas_id, request)


@admin_router.delete(
    "/kelas/{kelas_id}",
    response_model=MessageResponseDTO,
    summary="Delete Class",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def delete_kelas(
    kelas_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = KelasService(db)
    return await service.delete_kelas(kelas_id)


# ── Student Promotion ────────────────────────────────────────────────────────


@admin_router.post(
    "/kelas/promote",
    response_model=PromoteResultDTO,
    summary="Promote Students to New Academic Year",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def promote_students(
    request: PromoteStudentsDTO,
    db: AsyncSession = Depends(get_db),
) -> PromoteResultDTO:
    service = KelasService(db)
    return await service.promote_students(request)


# ── Student Assignment ───────────────────────────────────────────────────────


@admin_router.post(
    "/kelas/{kelas_id}/siswa",
    response_model=SiswaKelasResponseDTO,
    status_code=201,
    summary="Assign Student to Class",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def assign_siswa(
    kelas_id: UUID,
    request: AssignSiswaDTO,
    db: AsyncSession = Depends(get_db),
) -> SiswaKelasResponseDTO:
    service = KelasService(db)
    return await service.assign_siswa(kelas_id, request)


@guru_router.get(
    "/kelas/{kelas_id}/siswa",
    response_model=list[SiswaKelasResponseDTO],
    summary="List Students in Class",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru))],
)
async def list_siswa_in_kelas(
    kelas_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[SiswaKelasResponseDTO]:
    service = KelasService(db)
    return await service.list_siswa_in_kelas(kelas_id)


@admin_router.delete(
    "/kelas/{kelas_id}/siswa/{user_id}",
    response_model=MessageResponseDTO,
    summary="Remove Student from Class",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def remove_siswa(
    kelas_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = KelasService(db)
    return await service.remove_siswa(kelas_id, user_id)


router.include_router(admin_router)
router.include_router(guru_router)
router.include_router(student_router)

