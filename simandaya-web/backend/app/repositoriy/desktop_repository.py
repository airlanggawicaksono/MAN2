from datetime import datetime, time
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums import StatusSiswa, UserType
from app.models.absensi import Absensi
from app.models.desktop_settings import DesktopSettings
from app.models.izin_keluar import IzinKeluar
from app.models.siswa_profile import SiswaProfile
from app.models.user import User


class DesktopRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_active_students(self):
        result = await self.db.execute(
            select(
                User.user_id,
                User.user_type,
                SiswaProfile.nama_lengkap,
                SiswaProfile.nis,
                SiswaProfile.kelas_jurusan,
                SiswaProfile.card_no,
            )
            .join(SiswaProfile, User.user_id == SiswaProfile.user_id)
            .where(
                and_(
                    User.user_type == UserType.siswa,
                    SiswaProfile.status_siswa != StatusSiswa.lulus,
                )
            )
            .order_by(SiswaProfile.nama_lengkap)
        )
        return result.all()

    async def list_active_administrators(self):
        result = await self.db.execute(
            select(
                User.user_id,
                User.user_type,
                User.username,
            ).where(
                and_(
                    User.user_type == UserType.admin,
                    User.is_active.is_(True),
                )
            )
        )
        return result.all()

    async def find_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()

    async def find_absensi_by_user_and_date(self, user_id: UUID, tanggal):
        result = await self.db.execute(
            select(Absensi).where(
                and_(
                    Absensi.user_id == user_id,
                    Absensi.tanggal == tanggal,
                )
            )
        )
        return result.scalar_one_or_none()

    async def add_absensi(self, absensi: Absensi) -> None:
        self.db.add(absensi)

    async def find_izin_by_user_and_range(
        self, user_id: UUID, start_of_day: datetime, end_of_day: datetime
    ) -> IzinKeluar | None:
        result = await self.db.execute(
            select(IzinKeluar).where(
                and_(
                    IzinKeluar.user_id == user_id,
                    IzinKeluar.created_at >= start_of_day,
                    IzinKeluar.created_at <= end_of_day,
                )
            )
        )
        return result.scalar_one_or_none()

    async def add_izin(self, izin: IzinKeluar) -> None:
        self.db.add(izin)

    async def get_desktop_settings(self) -> DesktopSettings | None:
        result = await self.db.execute(
            select(DesktopSettings).where(DesktopSettings.id == 1)
        )
        return result.scalar_one_or_none()

    async def get_or_create_desktop_settings(self) -> DesktopSettings:
        settings = await self.get_desktop_settings()
        if settings:
            return settings
        settings = DesktopSettings(id=1, late_cutoff_time=time(7, 15))
        self.db.add(settings)
        await self.db.flush()
        return settings

    async def flush(self) -> None:
        await self.db.flush()

    async def commit(self) -> None:
        await self.db.commit()

    async def find_student_profile_by_user_id(self, user_id: UUID) -> SiswaProfile | None:
        result = await self.db.execute(
            select(SiswaProfile).where(SiswaProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def find_student_profile_by_card_no(self, card_no: str) -> SiswaProfile | None:
        result = await self.db.execute(
            select(SiswaProfile).where(SiswaProfile.card_no == card_no)
        )
        return result.scalar_one_or_none()

    async def rollback(self) -> None:
        await self.db.rollback()
