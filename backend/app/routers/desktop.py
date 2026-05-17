from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import verify_desktop_api_key
from app.services.desktop_service import DesktopService
from app.dto.absensi.attendance_settings_dto import AttendanceSettingsResponseDTO
from app.dto.desktop.desktop_request import BulkAttendanceSyncDTO, CardSetRequestDTO
from app.dto.desktop.desktop_response import (
    BulkAttendanceResponseDTO,
    CardSetResponseDTO,
    PingResponseDTO,
    StudentSyncDTO,
)
from app.repositoriy.desktop_repository import DesktopRepository

router = APIRouter(
    prefix="/api/desktop",
    tags=["Admin - Desktop Device"],
)


@router.get(
    "/students",
    response_model=list[StudentSyncDTO],
    summary="Sync Student List",
    description="Get all active students for desktop app RFID mapping.",
    dependencies=[Depends(verify_desktop_api_key)],
)
async def list_students(
    db: AsyncSession = Depends(get_db),
) -> list[StudentSyncDTO]:
    service = DesktopService(db)
    return await service.list_students()


@router.post(
    "/students/{user_id}/card",
    response_model=CardSetResponseDTO,
    summary="Set RFID Card",
    description=(
        "Single canonical endpoint to assign, replace, or remove a student's "
        "RFID card. BE writes the canonical value and enqueues a hik.card.sync "
        "DeviceJob; the sijinak worker reconciles Hikvision asynchronously. "
        "Send `rfid_number: null` to remove."
    ),
    dependencies=[Depends(verify_desktop_api_key)],
)
async def set_student_card(
    user_id: UUID,
    body: CardSetRequestDTO,
    db: AsyncSession = Depends(get_db),
) -> CardSetResponseDTO:
    service = DesktopService(db)
    return await service.set_student_card(user_id, body.rfid_number)


@router.post(
    "/sync-attendance",
    response_model=BulkAttendanceResponseDTO,
    summary="Bulk Sync Attendance",
    description="Sync multiple attendance events from desktop app.",
    dependencies=[Depends(verify_desktop_api_key)],
)
async def sync_attendance(
    request: BulkAttendanceSyncDTO,
    db: AsyncSession = Depends(get_db),
) -> BulkAttendanceResponseDTO:
    service = DesktopService(db)
    return await service.sync_attendance(request)


@router.get(
    "/ping",
    response_model=PingResponseDTO,
    summary="Desktop Ping",
    description="Simple connectivity check for desktop client.",
    dependencies=[Depends(verify_desktop_api_key)],
)
async def ping(
    db: AsyncSession = Depends(get_db),
) -> PingResponseDTO:
    service = DesktopService(db)
    return await service.ping()


@router.get(
    "/settings",
    response_model=AttendanceSettingsResponseDTO,
    summary="Desktop Settings (read)",
    description=(
        "Returns the live attendance settings (e.g. late cutoff time) that "
        "the sijinak app caches and surfaces in its tap UI. Edits still go "
        "through PATCH /api/v1/absensi/settings (admin only); changes are "
        "pushed to sijinak via the 'desktop.settings.changed' pubsub topic."
    ),
    dependencies=[Depends(verify_desktop_api_key)],
)
async def get_settings(
    db: AsyncSession = Depends(get_db),
) -> AttendanceSettingsResponseDTO:
    repo = DesktopRepository(db)
    settings = await repo.get_or_create_desktop_settings()
    await repo.commit()
    return AttendanceSettingsResponseDTO(late_cutoff_time=settings.late_cutoff_time)


