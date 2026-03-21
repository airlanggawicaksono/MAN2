from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType, TingkatKelas
from app.services.kurikulum_service import KurikulumService
from app.dto.akademik.kurikulum_mapel_dto import (
    CreateKurikulumMapelDTO,
    BulkAssignKurikulumMapelDTO,
    UpdateKurikulumMapelDTO,
    KurikulumMapelResponseDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO

router = APIRouter(
    prefix="/api/v1/akademik",
    tags=["Admin - Kurikulum"],
)


@router.post(
    "/kurikulum-mapel",
    response_model=KurikulumMapelResponseDTO,
    status_code=201,
    summary="Assign Subject to Grade Level",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def create_kurikulum_mapel(
    request: CreateKurikulumMapelDTO,
    db: AsyncSession = Depends(get_db),
) -> KurikulumMapelResponseDTO:
    service = KurikulumService(db)
    return await service.create_kurikulum_mapel(request)


@router.post(
    "/kurikulum-mapel/bulk",
    response_model=list[KurikulumMapelResponseDTO],
    status_code=201,
    summary="Bulk Assign Subjects to Grade Level",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def bulk_assign_kurikulum_mapel(
    request: BulkAssignKurikulumMapelDTO,
    db: AsyncSession = Depends(get_db),
) -> list[KurikulumMapelResponseDTO]:
    service = KurikulumService(db)
    return await service.bulk_assign(request)


@router.get(
    "/kurikulum-mapel/tahun-ajaran/{tahun_ajaran_id}",
    response_model=list[KurikulumMapelResponseDTO],
    summary="List All Curriculum Subjects for Academic Year",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def list_kurikulum_by_tahun_ajaran(
    tahun_ajaran_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[KurikulumMapelResponseDTO]:
    service = KurikulumService(db)
    return await service.list_by_tahun_ajaran(tahun_ajaran_id)


@router.get(
    "/kurikulum-mapel/tahun-ajaran/{tahun_ajaran_id}/tingkat/{tingkat}",
    response_model=list[KurikulumMapelResponseDTO],
    summary="List Curriculum Subjects by Grade Level",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def list_kurikulum_by_tingkat(
    tahun_ajaran_id: UUID,
    tingkat: TingkatKelas,
    db: AsyncSession = Depends(get_db),
) -> list[KurikulumMapelResponseDTO]:
    service = KurikulumService(db)
    return await service.list_by_tahun_ajaran_and_tingkat(tahun_ajaran_id, tingkat)


@router.patch(
    "/kurikulum-mapel/{kurikulum_mapel_id}",
    response_model=KurikulumMapelResponseDTO,
    summary="Update Curriculum Subject Assignment",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def update_kurikulum_mapel(
    kurikulum_mapel_id: UUID,
    request: UpdateKurikulumMapelDTO,
    db: AsyncSession = Depends(get_db),
) -> KurikulumMapelResponseDTO:
    service = KurikulumService(db)
    return await service.update_kurikulum_mapel(kurikulum_mapel_id, request)


@router.delete(
    "/kurikulum-mapel/{kurikulum_mapel_id}",
    response_model=MessageResponseDTO,
    summary="Remove Subject from Grade Level",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def delete_kurikulum_mapel(
    kurikulum_mapel_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = KurikulumService(db)
    return await service.delete_kurikulum_mapel(kurikulum_mapel_id)

