from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.config.settings import settings
from app.dependencies import verify_desktop_api_key, require_role
from app.enums import UserType
from app.models.user import User
from app.services.desktop_service import DesktopService
from app.dto.desktop.desktop_request import AttendanceEventDTO, UpdateDesktopSettingsDTO, BulkAttendanceSyncDTO
from app.dto.desktop.desktop_response import StudentSyncDTO, AttendanceAckDTO, DesktopSettingsDTO, BulkAttendanceResponseDTO
from datetime import datetime, timezone

router = APIRouter(
    prefix="/api/desktop",
    tags=["Desktop"],
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
    "/settings",
    response_model=DesktopSettingsDTO,
    summary="Get Desktop Settings",
    description="Get current desktop app settings (late cutoff time).",
    dependencies=[Depends(verify_desktop_api_key)],
)
async def get_settings(
    db: AsyncSession = Depends(get_db),
) -> DesktopSettingsDTO:
    service = DesktopService(db)
    return await service.get_settings()


@router.put(
    "/settings",
    response_model=DesktopSettingsDTO,
    summary="Update Desktop Settings",
    description="Update desktop app settings (admin only).",
)
async def update_settings(
    request: UpdateDesktopSettingsDTO,
    current_user: User = Depends(require_role(UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> DesktopSettingsDTO:
    service = DesktopService(db)
    return await service.update_settings(request.late_cutoff_time, current_user.user_id)

