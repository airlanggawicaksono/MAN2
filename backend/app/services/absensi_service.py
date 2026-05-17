from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.absensi.absensi_response import AbsensiResponseDTO, IzinKeluarResponseDTO
from app.dto.absensi.attendance_settings_dto import (
    AttendanceSettingsResponseDTO,
    UpdateAttendanceSettingsDTO,
)
from app.dto.absensi.absensi_update_dto import UpdateAbsensiDTO
from app.dto.absensi.public_response import PublicAbsensiDTO, PublicIzinKeluarDTO
from app.models.absensi import Absensi
from app.models.izin_keluar import IzinKeluar
from app.models.user import User
from app.policy.absensi_policy import AbsensiPolicy
from app.pubsub.desktop_pubsub import publish_absensi_changed, publish_settings_changed
from app.repositoriy.absensi_repository import AbsensiRepository
from app.repositoriy.desktop_repository import DesktopRepository


class AbsensiService:
    """
    Service for attendance and izin keluar records.
    SQL lives in repository; rules/permission checks live in policy.
    """

    def __init__(
        self,
        db: AsyncSession,
        repo: AbsensiRepository | None = None,
        policy: type[AbsensiPolicy] = AbsensiPolicy,
    ):
        self.repo = repo or AbsensiRepository(db)
        self.policy = policy
        self.desktop_repo = DesktopRepository(db)

    async def _validate_siswa(self, user_id: UUID) -> User:
        user = await self.repo.find_user_by_id(user_id)
        self.policy.ensure_user_exists(user)
        self.policy.ensure_is_siswa(user)
        return user

    def _to_absensi_dto(self, record: Absensi) -> AbsensiResponseDTO:
        return AbsensiResponseDTO(
            absensi_id=record.absensi_id,
            user_id=record.user_id,
            tanggal=record.tanggal,
            time_in=record.time_in,
            time_out=record.time_out,
            status=record.status,
            marked_by=record.marked_by,
        )

    def _to_izin_dto(self, record: IzinKeluar) -> IzinKeluarResponseDTO:
        return IzinKeluarResponseDTO(
            izin_id=record.izin_id,
            user_id=record.user_id,
            created_at=record.created_at,
            keterangan=record.keterangan,
            perkiraan_kembali=record.perkiraan_kembali,
        )

    async def list_absensi(self) -> list[AbsensiResponseDTO]:
        records = await self.repo.list_all_absensi()
        return [self._to_absensi_dto(r) for r in records]

    async def list_absensi_by_student(self, user_id: UUID) -> list[AbsensiResponseDTO]:
        await self._validate_siswa(user_id)
        records = await self.repo.find_absensi_by_user(user_id)
        return [self._to_absensi_dto(r) for r in records]

    async def get_absensi(self, absensi_id: UUID) -> AbsensiResponseDTO:
        record = await self.repo.find_absensi_by_id(absensi_id)
        self.policy.ensure_absensi_exists(record)
        return self._to_absensi_dto(record)

    async def update_absensi(
        self, absensi_id: UUID, request: UpdateAbsensiDTO, current_user: User
    ) -> AbsensiResponseDTO:
        try:
            record = await self.repo.find_absensi_by_id(absensi_id)
            self.policy.ensure_absensi_exists(record)

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_update_payload(update_data)

            for field, value in update_data.items():
                setattr(record, field, value)
            record.marked_by = current_user.user_id

            await self.repo.commit()
            publish_absensi_changed(
                user_ids=[record.user_id],
                affected_date=record.tanggal,
                kind="upsert",
            )
            return self._to_absensi_dto(record)
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update attendance: {str(e)}",
            )

    async def delete_absensi(self, absensi_id: UUID) -> None:
        try:
            record = await self.repo.find_absensi_by_id(absensi_id)
            self.policy.ensure_absensi_exists(record)
            user_id_snapshot = record.user_id
            tanggal_snapshot = record.tanggal
            await self.repo.delete_absensi(record)
            await self.repo.commit()
            publish_absensi_changed(
                user_ids=[user_id_snapshot],
                affected_date=tanggal_snapshot,
                kind="delete",
            )
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete attendance: {str(e)}",
            )

    async def list_izin_keluar(self) -> list[IzinKeluarResponseDTO]:
        records = await self.repo.list_all_izin_keluar()
        return [self._to_izin_dto(r) for r in records]

    async def list_izin_keluar_by_student(self, user_id: UUID) -> list[IzinKeluarResponseDTO]:
        await self._validate_siswa(user_id)
        records = await self.repo.find_izin_keluar_by_user(user_id)
        return [self._to_izin_dto(r) for r in records]

    async def get_izin_keluar(self, izin_id: UUID) -> IzinKeluarResponseDTO:
        record = await self.repo.find_izin_keluar_by_id(izin_id)
        self.policy.ensure_izin_exists(record)
        return self._to_izin_dto(record)

    def _to_public_absensi_dto(self, record: Absensi) -> PublicAbsensiDTO:
        profile = record.user.siswa_profile if record.user else None
        return PublicAbsensiDTO(
            absensi_id=record.absensi_id,
            nama_siswa=profile.nama_lengkap if profile else "Unknown",
            kelas=profile.kelas_jurusan if profile else None,
            tanggal=record.tanggal,
            time_in=record.time_in,
            time_out=record.time_out,
            status=record.status,
        )

    def _to_public_izin_dto(self, record: IzinKeluar) -> PublicIzinKeluarDTO:
        profile = record.user.siswa_profile if record.user else None
        return PublicIzinKeluarDTO(
            izin_id=record.izin_id,
            nama_siswa=profile.nama_lengkap if profile else "Unknown",
            kelas=profile.kelas_jurusan if profile else None,
            created_at=record.created_at,
            keterangan=record.keterangan,
            perkiraan_kembali=record.perkiraan_kembali,
        )

    async def list_absensi_public(
        self,
        tanggal: date,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[PublicAbsensiDTO]:
        records = await self.repo.list_absensi_public(
            tanggal=tanggal, search=search, skip=skip, limit=limit
        )
        return [self._to_public_absensi_dto(r) for r in records]

    async def list_izin_keluar_public(
        self,
        tanggal: date,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[PublicIzinKeluarDTO]:
        records = await self.repo.list_izin_keluar_public(
            tanggal=tanggal, search=search, skip=skip, limit=limit
        )
        return [self._to_public_izin_dto(r) for r in records]

    async def get_attendance_settings(self) -> AttendanceSettingsResponseDTO:
        settings = await self.desktop_repo.get_or_create_desktop_settings()
        await self.desktop_repo.commit()
        return AttendanceSettingsResponseDTO(late_cutoff_time=settings.late_cutoff_time)

    async def update_attendance_settings(
        self, request: UpdateAttendanceSettingsDTO, current_user: User
    ) -> AttendanceSettingsResponseDTO:
        try:
            settings = await self.desktop_repo.get_or_create_desktop_settings()
            settings.late_cutoff_time = request.late_cutoff_time
            settings.updated_by = current_user.user_id
            await self.desktop_repo.commit()
            response = AttendanceSettingsResponseDTO(late_cutoff_time=settings.late_cutoff_time)
            publish_settings_changed(response.model_dump(mode="json"))
            return response
        except Exception as e:
            await self.desktop_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update attendance settings: {str(e)}",
            )
