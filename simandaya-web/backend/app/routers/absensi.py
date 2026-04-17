from typing import Optional
from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.models.user import User
from app.services.absensi_service import AbsensiService
from app.dto.absensi.absensi_response import (
    AbsensiResponseDTO,
    IzinKeluarResponseDTO,
    MessageResponseDTO,
)
from app.dto.absensi.absensi_update_dto import UpdateAbsensiDTO
from app.dto.absensi.attendance_settings_dto import (
    AttendanceSettingsResponseDTO,
    UpdateAttendanceSettingsDTO,
)
from app.dto.absensi.public_response import (
    PublicAbsensiDTO,
    PublicIzinKeluarDTO,
)

router = APIRouter(
    prefix="/api/v1/absensi",
    tags=["Admin - Absensi"]
)


# ── Attendance ───────────────────────────────────────────────────────────────


@router.get(
    "/attendance",
    response_model=list[AbsensiResponseDTO],
    summary="List All Attendance",
    description="List all attendance records (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_absensi(
    db: AsyncSession = Depends(get_db),
) -> list[AbsensiResponseDTO]:
    service = AbsensiService(db)
    return await service.list_absensi()


@router.get(
    "/attendance/student/{user_id}",
    response_model=list[AbsensiResponseDTO],
    summary="List Attendance by Student",
    description="List attendance records for a specific student (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_absensi_by_student(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[AbsensiResponseDTO]:
    service = AbsensiService(db)
    return await service.list_absensi_by_student(user_id)


@router.get(
    "/attendance/{absensi_id}",
    response_model=AbsensiResponseDTO,
    summary="Get Attendance Record",
    description="Get a single attendance record by ID (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def get_absensi(
    absensi_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> AbsensiResponseDTO:
    service = AbsensiService(db)
    return await service.get_absensi(absensi_id)


@router.patch(
    "/attendance/{absensi_id}",
    response_model=AbsensiResponseDTO,
    summary="Update Attendance Record",
    description="Update a single attendance record (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def update_absensi(
    absensi_id: UUID,
    request: UpdateAbsensiDTO,
    current_user: User = Depends(require_role(UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> AbsensiResponseDTO:
    service = AbsensiService(db)
    return await service.update_absensi(absensi_id, request, current_user)


@router.delete(
    "/attendance/{absensi_id}",
    response_model=MessageResponseDTO,
    summary="Delete Attendance Record",
    description="Delete a single attendance record (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def delete_absensi(
    absensi_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = AbsensiService(db)
    await service.delete_absensi(absensi_id)
    return MessageResponseDTO(message="Attendance deleted successfully")


@router.get(
    "/settings",
    response_model=AttendanceSettingsResponseDTO,
    summary="Get Attendance Settings",
    description="Get attendance settings such as late cutoff time (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def get_attendance_settings(
    db: AsyncSession = Depends(get_db),
) -> AttendanceSettingsResponseDTO:
    service = AbsensiService(db)
    return await service.get_attendance_settings()


@router.patch(
    "/settings",
    response_model=AttendanceSettingsResponseDTO,
    summary="Update Attendance Settings",
    description="Update attendance settings such as late cutoff time (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def update_attendance_settings(
    request: UpdateAttendanceSettingsDTO,
    current_user: User = Depends(require_role(UserType.admin)),
    db: AsyncSession = Depends(get_db),
) -> AttendanceSettingsResponseDTO:
    service = AbsensiService(db)
    return await service.update_attendance_settings(request, current_user)


# ── Izin Keluar ──────────────────────────────────────────────────────────────


@router.get(
    "/izin-keluar",
    response_model=list[IzinKeluarResponseDTO],
    summary="List All Izin Keluar",
    description="List all izin keluar records (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_izin_keluar(
    db: AsyncSession = Depends(get_db),
) -> list[IzinKeluarResponseDTO]:
    service = AbsensiService(db)
    return await service.list_izin_keluar()


@router.get(
    "/izin-keluar/student/{user_id}",
    response_model=list[IzinKeluarResponseDTO],
    summary="List Izin Keluar by Student",
    description="List izin keluar records for a specific student (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_izin_keluar_by_student(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[IzinKeluarResponseDTO]:
    service = AbsensiService(db)
    return await service.list_izin_keluar_by_student(user_id)


@router.get(
    "/izin-keluar/{izin_id}",
    response_model=IzinKeluarResponseDTO,
    summary="Get Izin Keluar Record",
    description="Get a single izin keluar record by ID (Admin only).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def get_izin_keluar(
    izin_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> IzinKeluarResponseDTO:
    service = AbsensiService(db)
    return await service.get_izin_keluar(izin_id)


# ── Public (no auth) ────────────────────────────────────────────────────────


@router.get(
    "/public/attendance",
    tags=["Public - Absensi"],
    response_model=list[PublicAbsensiDTO],
    summary="Public Attendance List",
    description="List attendance records with student names. No auth required.",
)
async def list_absensi_public(
    tanggal: date = Query(description="Filter date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search by student name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[PublicAbsensiDTO]:
    service = AbsensiService(db)
    return await service.list_absensi_public(
        tanggal=tanggal, search=search, skip=skip, limit=limit
    )


@router.get(
    "/public/izin-keluar",
    tags=["Public - Absensi"],
    response_model=list[PublicIzinKeluarDTO],
    summary="Public Izin Keluar List",
    description="List izin keluar records with student names. No auth required.",
)
async def list_izin_keluar_public(
    tanggal: date = Query(description="Filter date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search by student name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[PublicIzinKeluarDTO]:
    service = AbsensiService(db)
    return await service.list_izin_keluar_public(
        tanggal=tanggal, search=search, skip=skip, limit=limit
    )

