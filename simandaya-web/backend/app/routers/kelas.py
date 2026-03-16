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

router = APIRouter(prefix="/api/v1/akademik", tags=["Kelas"])


# ── Kelas CRUD ───────────────────────────────────────────────────────────────


@router.post(
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


@router.get(
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


@router.get(
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


@router.get(
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


@router.get(
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


@router.patch(
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


@router.delete(
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


@router.post(
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


@router.post(
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


@router.get(
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


@router.delete(
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
