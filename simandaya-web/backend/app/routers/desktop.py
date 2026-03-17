from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import verify_desktop_api_key
from app.services.desktop_service import DesktopService
from app.dto.desktop.desktop_request import BulkAttendanceSyncDTO
from app.dto.desktop.desktop_response import (
    BulkAttendanceResponseDTO,
    PingResponseDTO,
    StudentSyncDTO,
)

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

