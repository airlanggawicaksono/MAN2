from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.services.akademik_service import AkademikService
from app.dto.akademik.kalender_dto import (
    CreateKalenderDTO, UpdateKalenderDTO, KalenderResponseDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO

router = APIRouter(
    prefix="/api/v1/akademik",
    tags=["Admin - Kalender Akademik"]
)


@router.post(
    "/kalender",
    response_model=KalenderResponseDTO,
    status_code=201,
    summary="Create Calendar Event",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def create_kalender(
    request: CreateKalenderDTO,
    db: AsyncSession = Depends(get_db),
) -> KalenderResponseDTO:
    service = AkademikService(db)
    return await service.create_kalender(request)


@router.get(
    "/kalender",
    response_model=list[KalenderResponseDTO],
    summary="List Calendar Events",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_kalender(
    db: AsyncSession = Depends(get_db),
) -> list[KalenderResponseDTO]:
    service = AkademikService(db)
    return await service.list_kalender()


@router.get(
    "/kalender/tahun-ajaran/{tahun_ajaran_id}",
    response_model=list[KalenderResponseDTO],
    summary="List Calendar by Academic Year",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_kalender_by_tahun_ajaran(
    tahun_ajaran_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[KalenderResponseDTO]:
    service = AkademikService(db)
    return await service.list_kalender_by_tahun_ajaran(tahun_ajaran_id)


@router.patch(
    "/kalender/{kalender_id}",
    response_model=KalenderResponseDTO,
    summary="Update Calendar Event",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def update_kalender(
    kalender_id: UUID,
    request: UpdateKalenderDTO,
    db: AsyncSession = Depends(get_db),
) -> KalenderResponseDTO:
    service = AkademikService(db)
    return await service.update_kalender(kalender_id, request)


@router.delete(
    "/kalender/{kalender_id}",
    response_model=MessageResponseDTO,
    summary="Delete Calendar Event",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def delete_kalender(
    kalender_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = AkademikService(db)
    return await service.delete_kalender(kalender_id)

