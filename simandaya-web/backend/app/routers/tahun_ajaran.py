from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.services.akademik_service import AkademikService
from app.dto.akademik.tahun_ajaran_dto import (
    CreateTahunAjaranDTO, UpdateTahunAjaranDTO, TahunAjaranResponseDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO

router = APIRouter(
    prefix="/api/v1/akademik",
    tags=["Tahun Ajaran"]
)


@router.post(
    "/tahun-ajaran",
    response_model=TahunAjaranResponseDTO,
    status_code=201,
    summary="Create Academic Year",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def create_tahun_ajaran(
    request: CreateTahunAjaranDTO,
    db: AsyncSession = Depends(get_db),
) -> TahunAjaranResponseDTO:
    service = AkademikService(db)
    return await service.create_tahun_ajaran(request)


@router.get(
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


@router.get(
    "/tahun-ajaran/{tahun_ajaran_id}",
    response_model=TahunAjaranResponseDTO,
    summary="Get Academic Year",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def get_tahun_ajaran(
    tahun_ajaran_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> TahunAjaranResponseDTO:
    service = AkademikService(db)
    return await service.get_tahun_ajaran(tahun_ajaran_id)


@router.patch(
    "/tahun-ajaran/{tahun_ajaran_id}",
    response_model=TahunAjaranResponseDTO,
    summary="Update Academic Year",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def update_tahun_ajaran(
    tahun_ajaran_id: UUID,
    request: UpdateTahunAjaranDTO,
    db: AsyncSession = Depends(get_db),
) -> TahunAjaranResponseDTO:
    service = AkademikService(db)
    return await service.update_tahun_ajaran(tahun_ajaran_id, request)


@router.delete(
    "/tahun-ajaran/{tahun_ajaran_id}",
    response_model=MessageResponseDTO,
    summary="Delete Academic Year",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def delete_tahun_ajaran(
    tahun_ajaran_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = AkademikService(db)
    return await service.delete_tahun_ajaran(tahun_ajaran_id)
