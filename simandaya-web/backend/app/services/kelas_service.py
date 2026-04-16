from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.akademik.kelas_dto import (
    AssignSiswaDTO,
    CreateKelasDTO,
    KelasResponseDTO,
    MessageResponseDTO,
    SiswaKelasResponseDTO,
    UpdateKelasDTO,
)
from app.models.kelas import Kelas
from app.models.siswa_kelas import SiswaKelas
from app.policy.kelas_policy import KelasPolicy
from app.repositoriy.kelas_repository import KelasRepository
from app.utils.db_error_utils import build_integrity_http_exception


KELAS_INTEGRITY_MESSAGES = {
    "ux_kelas_active_tahun_nama": "Nomor/nama kelas sudah terbuat pada tahun ajaran ini.",
    "uq_kelas_tahun_nama": "Nomor/nama kelas sudah terbuat pada tahun ajaran ini.",
    "uq_siswa_kelas": "Siswa sudah terdaftar pada kelas tersebut.",
}


class KelasService:
    def __init__(
        self,
        db: AsyncSession,
        repo: KelasRepository | None = None,
        policy: type[KelasPolicy] = KelasPolicy,
    ):
        self.repo = repo or KelasRepository(db)
        self.policy = policy

    def _to_kelas_dto(self, kelas: Kelas) -> KelasResponseDTO:
        wali_nama = None
        if kelas.wali_kelas and kelas.wali_kelas.guru_profile:
            wali_nama = kelas.wali_kelas.guru_profile.nama_lengkap
        kategori_nama = kelas.kategori_kelas.nama if kelas.kategori_kelas else None
        return KelasResponseDTO(
            kelas_id=kelas.kelas_id,
            tahun_ajaran_id=kelas.tahun_ajaran_id,
            nama_kelas=kelas.nama_kelas,
            tingkat=kelas.tingkat,
            kategori_kelas_id=kelas.kategori_kelas_id,
            kategori_kelas_nama=kategori_nama,
            wali_kelas_id=kelas.wali_kelas_id,
            wali_kelas_nama=wali_nama,
            kapasitas=kelas.kapasitas,
            is_active=kelas.is_active,
        )

    def _to_siswa_kelas_dto(self, siswa_kelas: SiswaKelas) -> SiswaKelasResponseDTO:
        nama_lengkap = None
        nis = None
        if siswa_kelas.user and siswa_kelas.user.siswa_profile:
            nama_lengkap = siswa_kelas.user.siswa_profile.nama_lengkap
            nis = siswa_kelas.user.siswa_profile.nis
        return SiswaKelasResponseDTO(
            siswa_kelas_id=siswa_kelas.siswa_kelas_id,
            kelas_id=siswa_kelas.kelas_id,
            user_id=siswa_kelas.user_id,
            nama_lengkap=nama_lengkap,
            nis=nis,
        )

    async def create_kelas(self, request: CreateKelasDTO) -> KelasResponseDTO:
        try:
            tahun_ajaran = await self.repo.find_tahun_ajaran_by_id(request.tahun_ajaran_id)
            self.policy.ensure_tahun_ajaran_exists(tahun_ajaran, request.tahun_ajaran_id)
            kategori = await self.repo.find_kategori_by_id(request.kategori_kelas_id)
            self.policy.ensure_kategori_exists(kategori, request.kategori_kelas_id)
            self.policy.ensure_kategori_active(kategori)
            self.policy.ensure_kategori_in_tahun_ajaran(kategori, request.tahun_ajaran_id)

            if request.wali_kelas_id:
                wali_kelas = await self.repo.find_user_by_id(request.wali_kelas_id)
                self.policy.ensure_user_exists(wali_kelas, request.wali_kelas_id)
                self.policy.ensure_user_is_guru(wali_kelas)
                wali_existing = await self.repo.find_kelas_by_tahun_and_wali(
                    request.tahun_ajaran_id, request.wali_kelas_id
                )
                self.policy.ensure_wali_kelas_available(wali_existing, wali_kelas.username)

            existing_kelas = await self.repo.find_kelas_by_tahun_and_name(
                request.tahun_ajaran_id, request.nama_kelas
            )
            self.policy.ensure_kelas_name_available(
                existing_kelas, request.nama_kelas, tahun_ajaran.nama
            )

            kelas = Kelas(
                tahun_ajaran_id=request.tahun_ajaran_id,
                nama_kelas=request.nama_kelas,
                tingkat=request.tingkat,
                kategori_kelas_id=request.kategori_kelas_id,
                wali_kelas_id=request.wali_kelas_id,
                kapasitas=request.kapasitas,
                is_active=True,
            )
            await self.repo.add_kelas(kelas)
            await self.repo.commit()

            kelas = await self.repo.find_kelas_by_id_with_wali(kelas.kelas_id)
            return self._to_kelas_dto(kelas)
        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal membuat kelas karena konflik data.",
                constraint_messages=KELAS_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create kelas: {str(e)}",
            )

    async def list_kelas(self) -> list[KelasResponseDTO]:
        try:
            kelas_list = await self.repo.list_kelas_with_wali()
            return [self._to_kelas_dto(kelas) for kelas in kelas_list]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list kelas: {str(e)}",
            )

    async def list_active_kelas(self) -> list[KelasResponseDTO]:
        try:
            kelas_list = await self.repo.list_active_kelas_with_wali()
            return [self._to_kelas_dto(kelas) for kelas in kelas_list]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list active kelas: {str(e)}",
            )

    async def get_kelas(self, kelas_id: UUID) -> KelasResponseDTO:
        try:
            kelas = await self.repo.find_kelas_by_id_with_wali(kelas_id)
            self.policy.ensure_kelas_exists(kelas, kelas_id)
            return self._to_kelas_dto(kelas)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get kelas: {str(e)}",
            )

    async def list_kelas_by_tahun_ajaran(self, tahun_ajaran_id: UUID) -> list[KelasResponseDTO]:
        try:
            kelas_list = await self.repo.list_kelas_by_tahun_with_wali(tahun_ajaran_id)
            return [self._to_kelas_dto(kelas) for kelas in kelas_list]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list kelas by tahun ajaran: {str(e)}",
            )

    async def update_kelas(self, kelas_id: UUID, request: UpdateKelasDTO) -> KelasResponseDTO:
        try:
            kelas = await self.repo.find_kelas_by_id(kelas_id)
            self.policy.ensure_kelas_exists(kelas, kelas_id)

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_update_payload(update_data)

            if "wali_kelas_id" in update_data and update_data["wali_kelas_id"] is not None:
                wali_kelas = await self.repo.find_user_by_id(update_data["wali_kelas_id"])
                self.policy.ensure_user_exists(wali_kelas, update_data["wali_kelas_id"])
                self.policy.ensure_user_is_guru(wali_kelas)
                wali_existing = await self.repo.find_kelas_by_tahun_and_wali(
                    kelas.tahun_ajaran_id,
                    update_data["wali_kelas_id"],
                    exclude_kelas_id=kelas.kelas_id,
                )
                self.policy.ensure_wali_kelas_available(wali_existing, wali_kelas.username)

            if "kategori_kelas_id" in update_data:
                if update_data["kategori_kelas_id"] is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="kategori_kelas_id cannot be null",
                    )
                kategori = await self.repo.find_kategori_by_id(update_data["kategori_kelas_id"])
                self.policy.ensure_kategori_exists(kategori, update_data["kategori_kelas_id"])
                self.policy.ensure_kategori_active(kategori)
                self.policy.ensure_kategori_in_tahun_ajaran(
                    kategori, kelas.tahun_ajaran_id
                )

            for field, value in update_data.items():
                setattr(kelas, field, value)

            await self.repo.commit()
            kelas = await self.repo.find_kelas_by_id_with_wali(kelas_id)
            return self._to_kelas_dto(kelas)
        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal memperbarui kelas karena konflik data.",
                constraint_messages=KELAS_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update kelas: {str(e)}",
            )

    async def delete_kelas(self, kelas_id: UUID) -> MessageResponseDTO:
        try:
            kelas = await self.repo.find_kelas_by_id(kelas_id)
            self.policy.ensure_kelas_exists(kelas, kelas_id)
            if kelas.is_active:
                kelas.is_active = False
            else:
                return MessageResponseDTO(message="Kelas is already archived")
            await self.repo.commit()
            return MessageResponseDTO(message=f"Kelas '{kelas.nama_kelas}' archived successfully")
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete kelas: {str(e)}",
            )

    async def assign_siswa(self, kelas_id: UUID, request: AssignSiswaDTO) -> SiswaKelasResponseDTO:
        try:
            kelas = await self.repo.find_kelas_by_id(kelas_id)
            self.policy.ensure_kelas_exists(kelas, kelas_id)
            self.policy.ensure_kelas_active(kelas)

            user = await self.repo.find_user_by_id(request.user_id)
            self.policy.ensure_user_exists(user, request.user_id)
            self.policy.ensure_user_is_siswa(user)

            existing_assignment = await self.repo.find_siswa_assignment(kelas_id, request.user_id)
            self.policy.ensure_siswa_not_already_assigned(
                existing_assignment, user.username, kelas.nama_kelas
            )

            existing_in_same_tahun = await self.repo.find_siswa_assignment_in_tahun(
                request.user_id, kelas.tahun_ajaran_id
            )
            if existing_in_same_tahun and existing_in_same_tahun.kelas_id != kelas_id:
                self.policy.ensure_siswa_not_already_assigned_in_same_tahun(
                    existing_in_same_tahun, user.username, kelas.nama_kelas
                )

            current_count = await self.repo.count_siswa_in_kelas(kelas_id)
            self.policy.ensure_kelas_capacity(current_count, kelas.kapasitas, kelas.nama_kelas)

            siswa_kelas = SiswaKelas(kelas_id=kelas_id, user_id=request.user_id)
            await self.repo.add_siswa_assignment(siswa_kelas)
            await self.repo.commit()

            siswa_kelas = await self.repo.find_siswa_assignment_by_id_with_user(
                siswa_kelas.siswa_kelas_id
            )
            return self._to_siswa_kelas_dto(siswa_kelas)
        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal memasukkan siswa ke kelas karena konflik data.",
                constraint_messages=KELAS_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to assign siswa to kelas: {str(e)}",
            )

    async def remove_siswa(self, kelas_id: UUID, user_id: UUID) -> MessageResponseDTO:
        try:
            siswa_kelas = await self.repo.find_siswa_assignment(kelas_id, user_id)
            self.policy.ensure_siswa_assignment_exists(siswa_kelas, kelas_id, user_id)
            await self.repo.delete_siswa_assignment(siswa_kelas)
            await self.repo.commit()
            return MessageResponseDTO(message="Siswa removed from kelas successfully")
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to remove siswa from kelas: {str(e)}",
            )

    async def list_siswa_in_kelas(self, kelas_id: UUID) -> list[SiswaKelasResponseDTO]:
        try:
            kelas = await self.repo.find_kelas_by_id(kelas_id)
            self.policy.ensure_kelas_exists(kelas, kelas_id)
            self.policy.ensure_kelas_active(kelas)
            siswa_kelas_list = await self.repo.list_siswa_in_kelas_with_user(kelas_id)
            return [self._to_siswa_kelas_dto(sk) for sk in siswa_kelas_list]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list siswa in kelas: {str(e)}",
            )

    async def get_student_kelas(self, user_id: UUID) -> KelasResponseDTO:
        kelas = await self.repo.get_student_kelas_with_wali(user_id)
        self.policy.ensure_student_has_kelas(kelas)
        return self._to_kelas_dto(kelas)
