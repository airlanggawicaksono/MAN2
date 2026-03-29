from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.services.akademik_service import AkademikService
from app.dto.akademik.tahun_ajaran_dto import (
    CopyTahunAjaranStructureDTO,
    CopyTahunAjaranStructureResponseDTO,
    CreateTahunAjaranDTO,
    TahunAjaranResponseDTO,
    UpdateTahunAjaranDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO

router = APIRouter(prefix="/api/v1/akademik")
admin_router = APIRouter(tags=["Admin - Tahun Ajaran"])
shared_router = APIRouter(tags=["Admin + Guru + Siswa - Tahun Ajaran"])


@admin_router.post(
    "/tahun-ajaran",
    response_model=TahunAjaranResponseDTO,
    status_code=201,
    summary="Create Academic Year",
)
async def create_tahun_ajaran(
    request: CreateTahunAjaranDTO,
    current_user = Depends(require_role(UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> TahunAjaranResponseDTO:
    del current_user
    service = AkademikService(db)
    return await service.create_tahun_ajaran(request)


@admin_router.post(
    "/tahun-ajaran/copy-structure",
    response_model=CopyTahunAjaranStructureResponseDTO,
    status_code=201,
    summary="Create Academic Year by Copying Structure",
)
async def copy_tahun_ajaran_structure(
    request: CopyTahunAjaranStructureDTO,
    current_user = Depends(require_role(UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> CopyTahunAjaranStructureResponseDTO:
    del current_user
    service = AkademikService(db)
    return await service.copy_tahun_ajaran_structure(request)


@shared_router.get(
    "/tahun-ajaran",
    response_model=list[TahunAjaranResponseDTO],
    summary="List Academic Years",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru, UserType.siswa))]
)
async def list_tahun_ajaran(
    db: AsyncSession = Depends(get_db),
) -> list[TahunAjaranResponseDTO]:
    service = AkademikService(db)
    return await service.list_tahun_ajaran()


@shared_router.get(
    "/tahun-ajaran/active",
    response_model=TahunAjaranResponseDTO,
    summary="Get Active Academic Year",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru, UserType.siswa))]
)
async def get_active_tahun_ajaran(
    db: AsyncSession = Depends(get_db),
) -> TahunAjaranResponseDTO:
    service = AkademikService(db)
    return await service.get_active_tahun_ajaran()


@admin_router.get(
    "/tahun-ajaran/{tahun_ajaran_id}",
    response_model=TahunAjaranResponseDTO,
    summary="Get Academic Year",
)
async def get_tahun_ajaran(
    tahun_ajaran_id: UUID,
    current_user = Depends(require_role(UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> TahunAjaranResponseDTO:
    del current_user
    service = AkademikService(db)
    return await service.get_tahun_ajaran(tahun_ajaran_id)


@admin_router.patch(
    "/tahun-ajaran/{tahun_ajaran_id}",
    response_model=TahunAjaranResponseDTO,
    summary="Update Academic Year",
)
async def update_tahun_ajaran(
    tahun_ajaran_id: UUID,
    request: UpdateTahunAjaranDTO,
    current_user = Depends(require_role(UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> TahunAjaranResponseDTO:
    del current_user
    service = AkademikService(db)
    return await service.update_tahun_ajaran(tahun_ajaran_id, request)


@admin_router.delete(
    "/tahun-ajaran/{tahun_ajaran_id}",
    response_model=MessageResponseDTO,
    summary="Delete Academic Year",
)
async def delete_tahun_ajaran(
    tahun_ajaran_id: UUID,
    current_user = Depends(require_role(UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    del current_user
    service = AkademikService(db)
    return await service.delete_tahun_ajaran(tahun_ajaran_id)


router.include_router(shared_router)
router.include_router(admin_router)

