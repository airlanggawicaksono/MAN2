from __future__ import annotations
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.models.user import User
from app.services.jadwal_service import JadwalService
from app.dto.akademik.guru_mapel_dto import (
    CreateGuruMapelDTO, GuruMapelResponseDTO,
    MessageResponseDTO,
)
from app.dto.akademik.jadwal_dto import (
    CreateJadwalDTO, UpdateJadwalDTO, JadwalResponseDTO,
)

router = APIRouter(
    prefix="/api/v1/akademik",
    tags=["Jadwal"]
)


# ── Guru Mapel (Teacher Assignment) ─────────────────────────────────────────


@router.post(
    "/guru-mapel",
    response_model=GuruMapelResponseDTO,
    status_code=201,
    summary="Assign Teacher to Subject+Class",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def create_guru_mapel(
    request: CreateGuruMapelDTO,
    db: AsyncSession = Depends(get_db),
) -> GuruMapelResponseDTO:
    service = JadwalService(db)
    return await service.create_guru_mapel(request)


@router.get(
    "/guru-mapel",
    response_model=list[GuruMapelResponseDTO],
    summary="List All Teacher Assignments",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_guru_mapel(
    db: AsyncSession = Depends(get_db),
) -> list[GuruMapelResponseDTO]:
    service = JadwalService(db)
    return await service.list_guru_mapel()


@router.get(
    "/guru-mapel/me",
    response_model=list[GuruMapelResponseDTO],
    summary="List My Teacher Assignments",
)
async def list_my_guru_mapel(
    current_user: User = Depends(require_role(UserType.guru)),
    db: AsyncSession = Depends(get_db),
) -> list[GuruMapelResponseDTO]:
    service = JadwalService(db)
    return await service.list_guru_mapel_by_guru(current_user.user_id)


@router.get(
    "/guru-mapel/guru/{user_id}",
    response_model=list[GuruMapelResponseDTO],
    summary="List Assignments for a Teacher",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru))]
)
async def list_guru_mapel_by_guru(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[GuruMapelResponseDTO]:
    service = JadwalService(db)
    return await service.list_guru_mapel_by_guru(user_id)


@router.get(
    "/guru-mapel/kelas/{kelas_id}",
    response_model=list[GuruMapelResponseDTO],
    summary="List Assignments for a Class",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru))]
)
async def list_guru_mapel_by_kelas(
    kelas_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[GuruMapelResponseDTO]:
    service = JadwalService(db)
    return await service.list_guru_mapel_by_kelas(kelas_id)


@router.delete(
    "/guru-mapel/{guru_mapel_id}",
    response_model=MessageResponseDTO,
    summary="Remove Teacher Assignment",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def delete_guru_mapel(
    guru_mapel_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = JadwalService(db)
    return await service.delete_guru_mapel(guru_mapel_id)


# ── Jadwal (Timetable) ──────────────────────────────────────────────────────


@router.post(
    "/jadwal",
    response_model=JadwalResponseDTO,
    status_code=201,
    summary="Create Timetable Entry",
    description="Create a timetable entry with clash validation (class + teacher conflicts).",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def create_jadwal(
    request: CreateJadwalDTO,
    db: AsyncSession = Depends(get_db),
) -> JadwalResponseDTO:
    service = JadwalService(db)
    return await service.create_jadwal(request)


@router.get(
    "/jadwal/semester/{semester_id}",
    response_model=list[JadwalResponseDTO],
    summary="List Timetable by Semester",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_jadwal_by_semester(
    semester_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[JadwalResponseDTO]:
    service = JadwalService(db)
    return await service.list_jadwal_by_semester(semester_id)


@router.get(
    "/jadwal/kelas/{kelas_id}",
    response_model=list[JadwalResponseDTO],
    summary="Get Timetable for a Class",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru))]
)
async def list_jadwal_by_kelas(
    kelas_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[JadwalResponseDTO]:
    service = JadwalService(db)
    return await service.list_jadwal_by_kelas(kelas_id)


@router.get(
    "/jadwal/guru/{user_id}",
    response_model=list[JadwalResponseDTO],
    summary="Get Timetable for a Teacher",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru))]
)
async def list_jadwal_by_guru(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[JadwalResponseDTO]:
    service = JadwalService(db)
    return await service.list_jadwal_by_guru(user_id)


@router.get(
    "/my-jadwal",
    response_model=list[JadwalResponseDTO],
    summary="Get My Timetable (Student or Teacher)",
)
async def get_my_jadwal(
    current_user: User = Depends(require_role(UserType.siswa, UserType.guru)),
    db: AsyncSession = Depends(get_db),
) -> list[JadwalResponseDTO]:
    service = JadwalService(db)
    if current_user.user_type == UserType.guru:
        return await service.list_jadwal_by_guru(current_user.user_id)
    else:
        return await service.get_student_jadwal(current_user.user_id)


@router.patch(
    "/jadwal/{jadwal_id}",
    response_model=JadwalResponseDTO,
    summary="Update Timetable Entry",
    description="Update a timetable entry with re-validation of clashes.",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def update_jadwal(
    jadwal_id: UUID,
    request: UpdateJadwalDTO,
    db: AsyncSession = Depends(get_db),
) -> JadwalResponseDTO:
    service = JadwalService(db)
    return await service.update_jadwal(jadwal_id, request)


@router.delete(
    "/jadwal/{jadwal_id}",
    response_model=MessageResponseDTO,
    summary="Delete Timetable Entry",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def delete_jadwal(
    jadwal_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = JadwalService(db)
    return await service.delete_jadwal(jadwal_id)
