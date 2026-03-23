from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.dependencies import require_role
from app.enums import UserType
from app.services.akademik_service import AkademikService
from app.dto.akademik.semester_dto import (
    CopySemesterStructureDTO,
    CopySemesterStructureResponseDTO,
    CreateSemesterDTO,
    SemesterResponseDTO,
    UpdateSemesterDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO

router = APIRouter(
    prefix="/api/v1/akademik",
    tags=["Admin + Guru + Siswa - Semester"]
)


@router.post(
    "/semester",
    response_model=SemesterResponseDTO,
    status_code=201,
    summary="Create Semester",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def create_semester(
    request: CreateSemesterDTO,
    db: AsyncSession = Depends(get_db),
) -> SemesterResponseDTO:
    service = AkademikService(db)
    return await service.create_semester(request)


@router.post(
    "/semester/copy-structure",
    response_model=CopySemesterStructureResponseDTO,
    status_code=201,
    summary="Create Semester by Copying Structure",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def copy_semester_structure(
    request: CopySemesterStructureDTO,
    db: AsyncSession = Depends(get_db),
) -> CopySemesterStructureResponseDTO:
    service = AkademikService(db)
    return await service.copy_semester_structure(request)


@router.get(
    "/semester",
    response_model=list[SemesterResponseDTO],
    summary="List Semesters",
    dependencies=[Depends(require_role(UserType.admin, UserType.guru, UserType.siswa))]
)
async def list_semesters(
    db: AsyncSession = Depends(get_db),
) -> list[SemesterResponseDTO]:
    service = AkademikService(db)
    return await service.list_semesters()


@router.get(
    "/semester/tahun-ajaran/{tahun_ajaran_id}",
    response_model=list[SemesterResponseDTO],
    summary="List Semesters by Academic Year",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def list_semesters_by_tahun_ajaran(
    tahun_ajaran_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[SemesterResponseDTO]:
    service = AkademikService(db)
    return await service.list_semesters_by_tahun_ajaran(tahun_ajaran_id)


@router.get(
    "/semester/{semester_id}",
    response_model=SemesterResponseDTO,
    summary="Get Semester",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def get_semester(
    semester_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> SemesterResponseDTO:
    service = AkademikService(db)
    return await service.get_semester(semester_id)


@router.patch(
    "/semester/{semester_id}",
    response_model=SemesterResponseDTO,
    summary="Update Semester",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def update_semester(
    semester_id: UUID,
    request: UpdateSemesterDTO,
    db: AsyncSession = Depends(get_db),
) -> SemesterResponseDTO:
    service = AkademikService(db)
    return await service.update_semester(semester_id, request)


@router.delete(
    "/semester/{semester_id}",
    response_model=MessageResponseDTO,
    summary="Delete Semester",
    dependencies=[Depends(require_role(UserType.admin))]
)
async def delete_semester(
    semester_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    service = AkademikService(db)
    return await service.delete_semester(semester_id)

