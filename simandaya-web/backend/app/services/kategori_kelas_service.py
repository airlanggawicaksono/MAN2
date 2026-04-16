from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.akademik.kategori_kelas_dto import (
    CreateKategoriKelasDTO,
    KategoriKelasArchiveImpactDTO,
    KategoriKelasResponseDTO,
    UpdateKategoriKelasDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO
from app.models.kategori_kelas import KategoriKelas
from app.policy.kategori_kelas_policy import KategoriKelasPolicy
from app.repositoriy.kategori_kelas_repository import KategoriKelasRepository
from app.repositoriy.tahun_ajaran_repository import TahunAjaranRepository
from app.policy.tahun_ajaran_policy import TahunAjaranPolicy
from app.utils.db_error_utils import build_integrity_http_exception


KATEGORI_INTEGRITY_MESSAGES = {
    "uq_kategori_tahun_kode": "Kode kategori sudah dipakai pada tahun ajaran ini.",
    "uq_kategori_tahun_nama": "Nama kategori sudah dipakai pada tahun ajaran ini.",
}


class KategoriKelasService:
    def __init__(
        self,
        db: AsyncSession,
        repo: KategoriKelasRepository | None = None,
        policy: type[KategoriKelasPolicy] = KategoriKelasPolicy,
    ):
        self.repo = repo or KategoriKelasRepository(db)
        self.policy = policy
        self.tahun_ajaran_repo = TahunAjaranRepository(db)
        self.tahun_ajaran_policy = TahunAjaranPolicy

    @staticmethod
    def _to_dto(k: KategoriKelas) -> KategoriKelasResponseDTO:
        return KategoriKelasResponseDTO(
            kategori_kelas_id=k.kategori_kelas_id,
            tahun_ajaran_id=k.tahun_ajaran_id,
            kode=k.kode,
            nama=k.nama,
            is_active=k.is_active,
        )

    async def _resolve_target_tahun_ajaran_id(
        self,
        tahun_ajaran_id: UUID | None,
        required: bool = True,
    ) -> UUID | None:
        if tahun_ajaran_id:
            ta = await self.tahun_ajaran_repo.find_by_id(tahun_ajaran_id)
            self.tahun_ajaran_policy.ensure_exists(ta)
            return tahun_ajaran_id
        active = await self.tahun_ajaran_repo.find_active()
        if not active:
            if not required:
                return None
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active tahun ajaran found. Provide tahun_ajaran_id explicitly.",
            )
        return active.tahun_ajaran_id

    async def list_kategori(
        self,
        status: str = "available",
        tahun_ajaran_id: UUID | None = None,
    ) -> list[KategoriKelasResponseDTO]:
        target_tahun_ajaran_id = await self._resolve_target_tahun_ajaran_id(
            tahun_ajaran_id,
            required=False,
        )
        if not target_tahun_ajaran_id:
            return []
        items = await self.repo.list_all(status=status, tahun_ajaran_id=target_tahun_ajaran_id)
        return [self._to_dto(item) for item in items]

    async def create_kategori(self, request: CreateKategoriKelasDTO) -> KategoriKelasResponseDTO:
        try:
            kode = request.kode.strip().upper()
            nama = request.nama.strip()
            target_tahun_ajaran_id = await self._resolve_target_tahun_ajaran_id(
                request.tahun_ajaran_id
            )

            existing_kode = await self.repo.find_by_kode(kode, target_tahun_ajaran_id)
            self.policy.ensure_kode_available(existing_kode, kode)

            existing_nama = await self.repo.find_by_nama(nama, target_tahun_ajaran_id)
            self.policy.ensure_nama_available(existing_nama, nama)

            obj = KategoriKelas(
                tahun_ajaran_id=target_tahun_ajaran_id,
                kode=kode,
                nama=nama,
                is_active=request.is_active,
            )
            await self.repo.add(obj)
            await self.repo.commit()
            await self.repo.refresh(obj)
            return self._to_dto(obj)
        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal membuat kategori kelas karena konflik data.",
                constraint_messages=KATEGORI_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create kategori kelas: {str(e)}",
            )

    async def update_kategori(
        self, kategori_kelas_id: UUID, request: UpdateKategoriKelasDTO
    ) -> KategoriKelasResponseDTO:
        try:
            obj = await self.repo.find_by_id(kategori_kelas_id)
            self.policy.ensure_exists(obj, kategori_kelas_id)

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_payload(update_data)
            was_active = obj.is_active

            if "kode" in update_data:
                kode = update_data["kode"].strip().upper()
                if kode != obj.kode:
                    existing_kode = await self.repo.find_by_kode(kode, obj.tahun_ajaran_id)
                    self.policy.ensure_kode_available(existing_kode, kode)
                update_data["kode"] = kode

            if "nama" in update_data:
                nama = update_data["nama"].strip()
                if nama != obj.nama:
                    existing_nama = await self.repo.find_by_nama(nama, obj.tahun_ajaran_id)
                    self.policy.ensure_nama_available(existing_nama, nama)
                update_data["nama"] = nama

            for field, value in update_data.items():
                setattr(obj, field, value)

            if was_active and obj.is_active is False:
                await self.repo.detach_active_relations_for_archived_kategori(obj)

            await self.repo.commit()
            await self.repo.refresh(obj)
            return self._to_dto(obj)
        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal memperbarui kategori kelas karena konflik data.",
                constraint_messages=KATEGORI_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update kategori kelas: {str(e)}",
            )

    async def delete_kategori(self, kategori_kelas_id: UUID) -> MessageResponseDTO:
        try:
            obj = await self.repo.find_by_id(kategori_kelas_id)
            self.policy.ensure_exists(obj, kategori_kelas_id)
            if obj.is_active:
                obj.is_active = False
                await self.repo.detach_active_relations_for_archived_kategori(obj)
            else:
                return MessageResponseDTO(message="Kategori kelas is already archived")
            await self.repo.commit()
            return MessageResponseDTO(
                message="Kategori kelas archived successfully. Related active class flows were detached."
            )
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete kategori kelas: {str(e)}",
            )

    async def get_archive_impact(self, kategori_kelas_id: UUID) -> KategoriKelasArchiveImpactDTO:
        obj = await self.repo.find_by_id(kategori_kelas_id)
        self.policy.ensure_exists(obj, kategori_kelas_id)
        kelas_count = await self.repo.count_kelas_usage(kategori_kelas_id)
        kurikulum_count = await self.repo.count_kurikulum_usage(kategori_kelas_id)
        return KategoriKelasArchiveImpactDTO(
            kategori_kelas_id=kategori_kelas_id,
            kelas_count=kelas_count,
            kurikulum_count=kurikulum_count,
        )
