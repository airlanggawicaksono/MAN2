from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.kelas import Kelas
from app.models.kategori_kelas import KategoriKelas
from app.models.siswa_kelas import SiswaKelas
from app.models.tahun_ajaran import TahunAjaran
from app.models.user import User


class KelasRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_tahun_ajaran_by_id(self, tahun_ajaran_id: UUID) -> TahunAjaran | None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.tahun_ajaran_id == tahun_ajaran_id)
        )
        return result.scalar_one_or_none()

    async def find_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()

    async def find_kelas_by_tahun_and_name(
        self, tahun_ajaran_id: UUID, nama_kelas: str
    ) -> Kelas | None:
        result = await self.db.execute(
            select(Kelas).where(
                Kelas.tahun_ajaran_id == tahun_ajaran_id,
                Kelas.nama_kelas == nama_kelas,
                Kelas.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def find_kelas_by_tahun_and_wali(
        self,
        tahun_ajaran_id: UUID,
        wali_kelas_id: UUID,
        exclude_kelas_id: UUID | None = None,
    ) -> Kelas | None:
        stmt = select(Kelas).where(
            Kelas.tahun_ajaran_id == tahun_ajaran_id,
            Kelas.wali_kelas_id == wali_kelas_id,
            Kelas.is_active.is_(True),
        )
        if exclude_kelas_id:
            stmt = stmt.where(Kelas.kelas_id != exclude_kelas_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_kelas_by_id(self, kelas_id: UUID) -> Kelas | None:
        result = await self.db.execute(select(Kelas).where(Kelas.kelas_id == kelas_id))
        return result.scalar_one_or_none()

    async def find_kelas_by_id_with_wali(self, kelas_id: UUID) -> Kelas | None:
        result = await self.db.execute(
            select(Kelas)
            .where(Kelas.kelas_id == kelas_id)
            .options(
                selectinload(Kelas.wali_kelas).selectinload(User.guru_profile),
                selectinload(Kelas.kategori_kelas),
            )
        )
        return result.scalar_one_or_none()

    async def list_kelas_with_wali(self) -> list[Kelas]:
        result = await self.db.execute(
            select(Kelas).options(
                selectinload(Kelas.wali_kelas).selectinload(User.guru_profile),
                selectinload(Kelas.kategori_kelas),
            ).where(Kelas.is_active.is_(True))
        )
        return list(result.scalars().all())

    async def list_active_kelas_with_wali(self) -> list[Kelas]:
        result = await self.db.execute(
            select(Kelas)
            .join(TahunAjaran, TahunAjaran.tahun_ajaran_id == Kelas.tahun_ajaran_id)
            .where(TahunAjaran.is_active.is_(True), Kelas.is_active.is_(True))
            .options(
                selectinload(Kelas.wali_kelas).selectinload(User.guru_profile),
                selectinload(Kelas.kategori_kelas),
            )
        )
        return list(result.scalars().all())

    async def list_kelas_by_tahun_with_wali(self, tahun_ajaran_id: UUID) -> list[Kelas]:
        result = await self.db.execute(
            select(Kelas)
            .where(Kelas.tahun_ajaran_id == tahun_ajaran_id, Kelas.is_active.is_(True))
            .options(
                selectinload(Kelas.wali_kelas).selectinload(User.guru_profile),
                selectinload(Kelas.kategori_kelas),
            )
        )
        return list(result.scalars().all())

    async def find_kategori_by_id(self, kategori_kelas_id: UUID) -> KategoriKelas | None:
        result = await self.db.execute(
            select(KategoriKelas).where(KategoriKelas.kategori_kelas_id == kategori_kelas_id)
        )
        return result.scalar_one_or_none()

    async def add_kelas(self, kelas: Kelas) -> None:
        self.db.add(kelas)

    async def delete_kelas(self, kelas: Kelas) -> None:
        await self.db.delete(kelas)

    async def find_siswa_assignment(self, kelas_id: UUID, user_id: UUID) -> SiswaKelas | None:
        result = await self.db.execute(
            select(SiswaKelas).where(
                SiswaKelas.kelas_id == kelas_id,
                SiswaKelas.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def find_siswa_assignment_in_tahun(
        self, user_id: UUID, tahun_ajaran_id: UUID
    ) -> SiswaKelas | None:
        result = await self.db.execute(
            select(SiswaKelas)
            .join(Kelas, Kelas.kelas_id == SiswaKelas.kelas_id)
            .where(
                SiswaKelas.user_id == user_id,
                Kelas.tahun_ajaran_id == tahun_ajaran_id,
                Kelas.is_active.is_(True),
            )
            .options(selectinload(SiswaKelas.kelas))
        )
        return result.scalar_one_or_none()

    async def count_siswa_in_kelas(self, kelas_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(SiswaKelas.siswa_kelas_id)).where(SiswaKelas.kelas_id == kelas_id)
        )
        return result.scalar() or 0

    async def add_siswa_assignment(self, siswa_kelas: SiswaKelas) -> None:
        self.db.add(siswa_kelas)

    async def find_siswa_assignment_by_id_with_user(
        self, siswa_kelas_id: UUID
    ) -> SiswaKelas | None:
        result = await self.db.execute(
            select(SiswaKelas)
            .where(SiswaKelas.siswa_kelas_id == siswa_kelas_id)
            .options(selectinload(SiswaKelas.user).selectinload(User.siswa_profile))
        )
        return result.scalar_one_or_none()

    async def list_siswa_in_kelas_with_user(self, kelas_id: UUID) -> list[SiswaKelas]:
        result = await self.db.execute(
            select(SiswaKelas)
            .where(SiswaKelas.kelas_id == kelas_id)
            .options(selectinload(SiswaKelas.user).selectinload(User.siswa_profile))
        )
        return list(result.scalars().all())

    async def delete_siswa_assignment(self, siswa_kelas: SiswaKelas) -> None:
        await self.db.delete(siswa_kelas)

    async def list_kelas_by_tahun(self, tahun_ajaran_id: UUID) -> list[Kelas]:
        result = await self.db.execute(
            select(Kelas).where(
                Kelas.tahun_ajaran_id == tahun_ajaran_id,
                Kelas.is_active.is_(True),
            )
        )
        return list(result.scalars().all())

    async def list_siswa_assignments_by_kelas(self, kelas_id: UUID) -> list[SiswaKelas]:
        result = await self.db.execute(
            select(SiswaKelas).where(SiswaKelas.kelas_id == kelas_id)
        )
        return list(result.scalars().all())

    async def get_student_kelas_with_wali(self, user_id: UUID) -> Kelas | None:
        result = await self.db.execute(
            select(Kelas)
            .join(SiswaKelas, SiswaKelas.kelas_id == Kelas.kelas_id)
            .join(TahunAjaran, TahunAjaran.tahun_ajaran_id == Kelas.tahun_ajaran_id)
            .where(SiswaKelas.user_id == user_id, Kelas.is_active.is_(True))
            .order_by(
                TahunAjaran.is_active.desc(),
                TahunAjaran.tanggal_mulai.desc(),
                Kelas.nama_kelas.asc(),
            )
            .options(
                selectinload(Kelas.wali_kelas).selectinload(User.guru_profile),
                selectinload(Kelas.kategori_kelas),
            )
        )
        return result.scalars().first()

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()
