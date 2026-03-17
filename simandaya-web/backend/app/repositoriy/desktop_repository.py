from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums import UserType
from app.models.absensi import Absensi
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
                SiswaProfile.nama_lengkap,
                SiswaProfile.nis,
                SiswaProfile.kelas_jurusan,
            )
            .join(SiswaProfile, User.user_id == SiswaProfile.user_id)
            .where(
                and_(
                    User.user_type == UserType.siswa,
                    User.is_active.is_(True),
                )
            )
            .order_by(SiswaProfile.nama_lengkap)
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

    async def flush(self) -> None:
        await self.db.flush()

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()
