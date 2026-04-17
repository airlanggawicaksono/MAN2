from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.services.akademik_service import AkademikService
from app.dto.akademik.slot_waktu_dto import (
    CreateSlotWaktuDTO, UpdateSlotWaktuDTO, SlotWaktuResponseDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO

router = APIRouter(
    prefix="/api/v1/akademik",
    tags=["Admin - Slot Waktu"]
)


@router.post(
    "/slot-waktu",
    response_model=SlotWaktuResponseDTO,
    status_code=201,
    summary="Create Time Slot",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def create_slot_waktu(
    request: CreateSlotWaktuDTO,
    db: AsyncSession = Depends(get_db),
) -> SlotWaktuResponseDTO:
    service = AkademikService(db)
    return await service.create_slot_waktu(request)


@router.get(
    "/slot-waktu",
    response_model=list[SlotWaktuResponseDTO],
    summary="List Time Slots",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_slot_waktu(
    db: AsyncSession = Depends(get_db),
) -> list[SlotWaktuResponseDTO]:
    service = AkademikService(db)
    return await service.list_slot_waktu()


@router.patch(
    "/slot-waktu/{slot_id}",
    response_model=SlotWaktuResponseDTO,
    summary="Update Time Slot",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def update_slot_waktu(
    slot_id: UUID,
    request: UpdateSlotWaktuDTO,
    db: AsyncSession = Depends(get_db),
) -> SlotWaktuResponseDTO:
    service = AkademikService(db)
    return await service.update_slot_waktu(slot_id, request)


@router.delete(
    "/slot-waktu/{slot_id}",
    response_model=MessageResponseDTO,
    summary="Delete Time Slot",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def delete_slot_waktu(
    slot_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = AkademikService(db)
    return await service.delete_slot_waktu(slot_id)

