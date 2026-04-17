from uuid import UUID
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.dependencies import require_role
from app.dto.akademik.kategori_kelas_dto import (
    CreateKategoriKelasDTO,
    KategoriKelasArchiveImpactDTO,
    KategoriKelasResponseDTO,
    UpdateKategoriKelasDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO
from app.enums import UserType
from app.services.kategori_kelas_service import KategoriKelasService

router = APIRouter(prefix="/api/v1/akademik", tags=["Admin - Kategori Kelas"])


@router.get(
    "/kategori-kelas",
    response_model=list[KategoriKelasResponseDTO],
    summary="List Kategori Kelas",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def list_kategori_kelas(
    status: Literal["available", "archived", "all"] = Query(default="available"),
    tahun_ajaran_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[KategoriKelasResponseDTO]:
    return await KategoriKelasService(db).list_kategori(
        status=status,
        tahun_ajaran_id=tahun_ajaran_id,
    )


@router.post(
    "/kategori-kelas",
    response_model=KategoriKelasResponseDTO,
    status_code=201,
    summary="Create Kategori Kelas",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def create_kategori_kelas(
    request: CreateKategoriKelasDTO,
    db: AsyncSession = Depends(get_db),
) -> KategoriKelasResponseDTO:
    return await KategoriKelasService(db).create_kategori(request)


@router.patch(
    "/kategori-kelas/{kategori_kelas_id}",
    response_model=KategoriKelasResponseDTO,
    summary="Update Kategori Kelas",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def update_kategori_kelas(
    kategori_kelas_id: UUID,
    request: UpdateKategoriKelasDTO,
    db: AsyncSession = Depends(get_db),
) -> KategoriKelasResponseDTO:
    return await KategoriKelasService(db).update_kategori(kategori_kelas_id, request)


@router.delete(
    "/kategori-kelas/{kategori_kelas_id}",
    response_model=MessageResponseDTO,
    summary="Archive Kategori Kelas",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def delete_kategori_kelas(
    kategori_kelas_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponseDTO:
    return await KategoriKelasService(db).delete_kategori(kategori_kelas_id)


@router.get(
    "/kategori-kelas/{kategori_kelas_id}/archive-impact",
    response_model=KategoriKelasArchiveImpactDTO,
    summary="Get Kategori Kelas Archive Impact",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def get_kategori_kelas_archive_impact(
    kategori_kelas_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> KategoriKelasArchiveImpactDTO:
    return await KategoriKelasService(db).get_archive_impact(kategori_kelas_id)
