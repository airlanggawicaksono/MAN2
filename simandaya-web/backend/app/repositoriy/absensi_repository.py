from datetime import date
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.absensi import Absensi
from app.models.guru_mapel import GuruMapel
from app.models.izin_keluar import IzinKeluar
from app.models.kelas import Kelas
from app.models.siswa_kelas import SiswaKelas
from app.models.siswa_profile import SiswaProfile
from app.models.user import User


class AbsensiRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()

    async def list_all_absensi(self) -> list[Absensi]:
        result = await self.db.execute(select(Absensi))
        return list(result.scalars().all())

    async def find_absensi_by_user(self, user_id: UUID) -> list[Absensi]:
        result = await self.db.execute(
            select(Absensi).where(Absensi.user_id == user_id)
        )
        return list(result.scalars().all())

    async def find_absensi_by_id(self, absensi_id: UUID) -> Absensi | None:
        result = await self.db.execute(
            select(Absensi).where(Absensi.absensi_id == absensi_id)
        )
        return result.scalar_one_or_none()

    async def find_absensi_by_user_and_date(
        self, user_id: UUID, tanggal: date
    ) -> Absensi | None:
        result = await self.db.execute(
            select(Absensi).where(
                and_(
                    Absensi.user_id == user_id,
                    Absensi.tanggal == tanggal,
                )
            )
        )
        return result.scalar_one_or_none()

    async def add_absensi(self, record: Absensi) -> None:
        self.db.add(record)

    async def list_all_izin_keluar(self) -> list[IzinKeluar]:
        result = await self.db.execute(select(IzinKeluar))
        return list(result.scalars().all())

    async def find_izin_keluar_by_user(self, user_id: UUID) -> list[IzinKeluar]:
        result = await self.db.execute(
            select(IzinKeluar).where(IzinKeluar.user_id == user_id)
        )
        return list(result.scalars().all())

    async def find_izin_keluar_by_id(self, izin_id: UUID) -> IzinKeluar | None:
        result = await self.db.execute(
            select(IzinKeluar).where(IzinKeluar.izin_id == izin_id)
        )
        return result.scalar_one_or_none()

    async def list_absensi_public(
        self,
        tanggal: date,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Absensi]:
        stmt = (
            select(Absensi)
            .join(User, Absensi.user_id == User.user_id)
            .outerjoin(SiswaProfile, User.user_id == SiswaProfile.user_id)
            .options(selectinload(Absensi.user).selectinload(User.siswa_profile))
            .where(Absensi.tanggal == tanggal)
        )
        if search:
            stmt = stmt.where(SiswaProfile.nama_lengkap.ilike(f"%{search}%"))
        stmt = stmt.order_by(SiswaProfile.nama_lengkap).offset(skip).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_izin_keluar_public(
        self,
        tanggal: date,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[IzinKeluar]:
        stmt = (
            select(IzinKeluar)
            .join(User, IzinKeluar.user_id == User.user_id)
            .outerjoin(SiswaProfile, User.user_id == SiswaProfile.user_id)
            .options(selectinload(IzinKeluar.user).selectinload(User.siswa_profile))
            .where(func.date(IzinKeluar.created_at) == tanggal)
        )
        if search:
            stmt = stmt.where(SiswaProfile.nama_lengkap.ilike(f"%{search}%"))
        stmt = stmt.order_by(IzinKeluar.created_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def find_kelas_by_id(self, kelas_id: UUID) -> Kelas | None:
        result = await self.db.execute(select(Kelas).where(Kelas.kelas_id == kelas_id))
        return result.scalar_one_or_none()

    async def is_guru_teaching_kelas(self, user_id: UUID, kelas_id: UUID) -> bool:
        result = await self.db.execute(
            select(GuruMapel).where(
                and_(
                    GuruMapel.user_id == user_id,
                    GuruMapel.kelas_id == kelas_id,
                )
            )
        )
        return result.first() is not None

    async def get_student_ids_in_kelas(self, kelas_id: UUID) -> set[UUID]:
        result = await self.db.execute(
            select(SiswaKelas.user_id).where(SiswaKelas.kelas_id == kelas_id)
        )
        return {row[0] for row in result.all()}

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()
