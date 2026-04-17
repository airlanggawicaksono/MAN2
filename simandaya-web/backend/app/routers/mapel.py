from uuid import UUID
from typing import Literal
from fastapi import APIRouter, Depends
from fastapi import Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.services.akademik_service import AkademikService
from app.dto.akademik.mapel_dto import (
    CreateMapelDTO, MapelArchiveImpactDTO, MapelResponseDTO, UpdateMapelDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO

router = APIRouter(
    prefix="/api/v1/akademik",
    tags=["Admin - Mata Pelajaran"]
)


@router.post(
    "/mapel",
    response_model=MapelResponseDTO,
    status_code=201,
    summary="Create Subject",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def create_mapel(
    request: CreateMapelDTO,
    db: AsyncSession = Depends(get_db),
) -> MapelResponseDTO:
    service = AkademikService(db)
    return await service.create_mapel(request)


@router.get(
    "/mapel",
    response_model=list[MapelResponseDTO],
    summary="List Subjects",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_mapel(
    status: Literal["available", "archived", "all"] = Query(default="available"),
    tahun_ajaran_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[MapelResponseDTO]:
    service = AkademikService(db)
    return await service.list_mapel(status=status, tahun_ajaran_id=tahun_ajaran_id)


@router.get(
    "/mapel/{mapel_id}",
    response_model=MapelResponseDTO,
    summary="Get Subject",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def get_mapel(
    mapel_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MapelResponseDTO:
    service = AkademikService(db)
    return await service.get_mapel(mapel_id)


@router.patch(
    "/mapel/{mapel_id}",
    response_model=MapelResponseDTO,
    summary="Update Subject",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def update_mapel(
    mapel_id: UUID,
    request: UpdateMapelDTO,
    db: AsyncSession = Depends(get_db),
) -> MapelResponseDTO:
    service = AkademikService(db)
    return await service.update_mapel(mapel_id, request)


@router.delete(
    "/mapel/{mapel_id}",
    response_model=MessageResponseDTO,
    summary="Archive Subject",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def delete_mapel(
    mapel_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = AkademikService(db)
    return await service.delete_mapel(mapel_id)


@router.get(
    "/mapel/{mapel_id}/archive-impact",
    response_model=MapelArchiveImpactDTO,
    summary="Get Subject Archive Impact",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def get_mapel_archive_impact(
    mapel_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MapelArchiveImpactDTO:
    service = AkademikService(db)
    return await service.get_mapel_archive_impact(mapel_id)

