from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.akademik.kelas_dto import MessageResponseDTO
from app.dto.akademik.kurikulum_mapel_dto import (
    BulkAssignKurikulumMapelDTO,
    CreateKurikulumMapelDTO,
    KurikulumMapelResponseDTO,
    UpdateKurikulumMapelDTO,
)
from app.enums import TingkatKelas
from app.models.kurikulum_mapel import KurikulumMapel
from app.policy.kurikulum_policy import KurikulumPolicy
from app.repositoriy.kurikulum_repository import KurikulumRepository
from app.utils.db_error_utils import build_integrity_http_exception


KURIKULUM_INTEGRITY_MESSAGES = {
    "ux_kurikulum_mapel_active": "Mapel sudah ada pada struktur kurikulum aktif untuk tingkat/kategori ini.",
    "uq_kurikulum_mapel": "Mapel sudah ada pada struktur kurikulum aktif untuk tingkat/kategori ini.",
}


class KurikulumService:
    def __init__(
        self,
        db: AsyncSession,
        repo: KurikulumRepository | None = None,
        policy: type[KurikulumPolicy] = KurikulumPolicy,
    ):
        self.repo = repo or KurikulumRepository(db)
        self.policy = policy

    async def create_kurikulum_mapel(self, request: CreateKurikulumMapelDTO) -> KurikulumMapelResponseDTO:
        try:
            mapel = await self.repo.find_mapel_by_id(request.mapel_id)
            self.policy.ensure_mapel_exists(mapel, request.mapel_id)
            self.policy.ensure_mapel_active(mapel)
            self.policy.ensure_mapel_in_tahun_ajaran(mapel, request.tahun_ajaran_id)

            tahun_ajaran = await self.repo.find_tahun_ajaran_by_id(request.tahun_ajaran_id)
            self.policy.ensure_tahun_ajaran_exists(tahun_ajaran, request.tahun_ajaran_id)
            kategori = await self.repo.find_kategori_by_id(request.kategori_kelas_id)
            self.policy.ensure_kategori_exists(kategori, request.kategori_kelas_id)
            self.policy.ensure_kategori_active(kategori)
            self.policy.ensure_kategori_in_tahun_ajaran(kategori, request.tahun_ajaran_id)
            self.policy.ensure_kategori_in_tahun_ajaran(kategori, request.tahun_ajaran_id)

            existing = await self.repo.find_assignment(
                request.mapel_id,
                request.tingkat,
                request.tahun_ajaran_id,
                request.kategori_kelas_id,
            )
            self.policy.ensure_assignment_unique(existing, mapel.nama_mapel, request.tingkat.value)

            km = KurikulumMapel(
                mapel_id=request.mapel_id,
                tahun_ajaran_id=request.tahun_ajaran_id,
                tingkat=request.tingkat,
                kategori_kelas_id=request.kategori_kelas_id,
                is_active=True,
                is_wajib=request.is_wajib,
                jam_override=request.jam_override,
            )
            await self.repo.add_assignment(km)
            await self.repo.commit()
            await self.repo.refresh(km)
            return self._to_dto(km)
        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal membuat struktur kurikulum karena konflik data.",
                constraint_messages=KURIKULUM_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create kurikulum mapel: {str(e)}",
            )

    async def bulk_assign(self, request: BulkAssignKurikulumMapelDTO) -> list[KurikulumMapelResponseDTO]:
        try:
            tahun_ajaran = await self.repo.find_tahun_ajaran_by_id(request.tahun_ajaran_id)
            self.policy.ensure_tahun_ajaran_exists(tahun_ajaran, request.tahun_ajaran_id)
            kategori = await self.repo.find_kategori_by_id(request.kategori_kelas_id)
            self.policy.ensure_kategori_exists(kategori, request.kategori_kelas_id)
            self.policy.ensure_kategori_active(kategori)

            created: list[KurikulumMapel] = []
            for mapel_id in request.mapel_ids:
                mapel = await self.repo.find_mapel_by_id(mapel_id)
                self.policy.ensure_mapel_exists(mapel, mapel_id)
                self.policy.ensure_mapel_active(mapel)
                self.policy.ensure_mapel_in_tahun_ajaran(mapel, request.tahun_ajaran_id)

                existing = await self.repo.find_assignment(
                    mapel_id,
                    request.tingkat,
                    request.tahun_ajaran_id,
                    request.kategori_kelas_id,
                )
                if existing:
                    continue

                km = KurikulumMapel(
                    mapel_id=mapel_id,
                    tahun_ajaran_id=request.tahun_ajaran_id,
                    tingkat=request.tingkat,
                    kategori_kelas_id=request.kategori_kelas_id,
                    is_active=True,
                    is_wajib=request.is_wajib,
                )
                await self.repo.add_assignment(km)
                created.append(km)

            await self.repo.commit()
            for km in created:
                await self.repo.refresh(km)
            return [self._to_dto(km) for km in created]
        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal bulk assign kurikulum karena konflik data.",
                constraint_messages=KURIKULUM_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to bulk assign kurikulum mapel: {str(e)}",
            )

    async def list_by_tahun_ajaran_and_tingkat(
        self,
        tahun_ajaran_id: UUID,
        tingkat: TingkatKelas,
        kategori_kelas_id: UUID | None = None,
    ) -> list[KurikulumMapelResponseDTO]:
        try:
            items = await self.repo.list_by_tahun_ajaran_and_tingkat(
                tahun_ajaran_id, tingkat, kategori_kelas_id
            )
            return [self._to_dto(km) for km in items]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list kurikulum by tingkat: {str(e)}",
            )

    async def list_by_tahun_ajaran(
        self, tahun_ajaran_id: UUID, kategori_kelas_id: UUID | None = None
    ) -> list[KurikulumMapelResponseDTO]:
        try:
            items = await self.repo.list_by_tahun_ajaran(tahun_ajaran_id, kategori_kelas_id)
            return [self._to_dto(km) for km in items]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list kurikulum by tahun ajaran: {str(e)}",
            )

    async def update_kurikulum_mapel(
        self, kurikulum_mapel_id: UUID, request: UpdateKurikulumMapelDTO
    ) -> KurikulumMapelResponseDTO:
        try:
            km = await self.repo.find_kurikulum_mapel_by_id(kurikulum_mapel_id)
            self.policy.ensure_kurikulum_mapel_exists(km, kurikulum_mapel_id)
            if not km.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Curriculum-subject assignment is archived",
                )

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_update_payload(update_data)

            for field, value in update_data.items():
                setattr(km, field, value)

            await self.repo.commit()
            await self.repo.refresh(km)
            return self._to_dto(km)
        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal memperbarui struktur kurikulum karena konflik data.",
                constraint_messages=KURIKULUM_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update kurikulum mapel: {str(e)}",
            )

    async def delete_kurikulum_mapel(self, kurikulum_mapel_id: UUID) -> MessageResponseDTO:
        try:
            km = await self.repo.find_kurikulum_mapel_by_id(kurikulum_mapel_id)
            self.policy.ensure_kurikulum_mapel_exists(km, kurikulum_mapel_id)
            if not km.is_active:
                return MessageResponseDTO(message="Curriculum-subject assignment already archived")
            km.is_active = False
            await self.repo.commit()
            return MessageResponseDTO(message="Curriculum subject assignment archived")
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete kurikulum mapel: {str(e)}",
            )

    def _to_dto(self, km: KurikulumMapel) -> KurikulumMapelResponseDTO:
        mapel = km.mapel
        return KurikulumMapelResponseDTO(
            kurikulum_mapel_id=km.kurikulum_mapel_id,
            mapel_id=km.mapel_id,
            tahun_ajaran_id=km.tahun_ajaran_id,
            tingkat=km.tingkat,
            kategori_kelas_id=km.kategori_kelas_id,
            kategori_kelas_nama=km.kategori_kelas.nama if km.kategori_kelas else None,
            is_active=km.is_active,
            is_wajib=km.is_wajib,
            jam_override=km.jam_override,
            mapel_nama=mapel.nama_mapel if mapel else None,
            kode_mapel=mapel.kode_mapel if mapel else None,
            kelompok=mapel.kelompok.value if mapel else None,
        )
