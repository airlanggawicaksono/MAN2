from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.guru_mapel import GuruMapel
from app.models.jadwal import Jadwal
from app.models.kelas import Kelas
from app.models.kategori_kelas import KategoriKelas
from app.models.kurikulum_mapel import KurikulumMapel
from app.models.semester import Semester
from app.models.tugas import Tugas


class KategoriKelasRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(
        self,
        status: str = "available",
        tahun_ajaran_id: UUID | None = None,
    ) -> list[KategoriKelas]:
        query = select(KategoriKelas)
        if tahun_ajaran_id:
            query = query.where(KategoriKelas.tahun_ajaran_id == tahun_ajaran_id)
        if status == "available":
            query = query.where(KategoriKelas.is_active.is_(True))
        elif status == "archived":
            query = query.where(KategoriKelas.is_active.is_(False))
        result = await self.db.execute(query.order_by(KategoriKelas.nama.asc()))
        return list(result.scalars().all())

    async def find_by_id(self, kategori_kelas_id: UUID) -> KategoriKelas | None:
        result = await self.db.execute(
            select(KategoriKelas).where(KategoriKelas.kategori_kelas_id == kategori_kelas_id)
        )
        return result.scalar_one_or_none()

    async def find_by_kode(self, kode: str, tahun_ajaran_id: UUID) -> KategoriKelas | None:
        result = await self.db.execute(
            select(KategoriKelas).where(
                KategoriKelas.kode == kode,
                KategoriKelas.tahun_ajaran_id == tahun_ajaran_id,
            )
        )
        return result.scalar_one_or_none()

    async def find_by_nama(self, nama: str, tahun_ajaran_id: UUID) -> KategoriKelas | None:
        result = await self.db.execute(
            select(KategoriKelas).where(
                KategoriKelas.nama == nama,
                KategoriKelas.tahun_ajaran_id == tahun_ajaran_id,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, kategori: KategoriKelas) -> None:
        self.db.add(kategori)

    async def delete(self, kategori: KategoriKelas) -> None:
        await self.db.delete(kategori)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, obj) -> None:
        await self.db.refresh(obj)

    async def detach_active_relations_for_archived_kategori(self, kategori: KategoriKelas) -> None:
        await self.db.execute(
            update(Kelas)
            .where(
                Kelas.kategori_kelas_id == kategori.kategori_kelas_id,
                Kelas.tahun_ajaran_id == kategori.tahun_ajaran_id,
                Kelas.is_active.is_(True),
            )
            .values(is_active=False)
        )

        kelas_ids_subq = select(Kelas.kelas_id).where(
            Kelas.kategori_kelas_id == kategori.kategori_kelas_id,
            Kelas.tahun_ajaran_id == kategori.tahun_ajaran_id,
        )
        semester_ids_subq = select(Semester.semester_id).where(
            Semester.tahun_ajaran_id == kategori.tahun_ajaran_id
        )

        await self.db.execute(
            update(KurikulumMapel)
            .where(
                KurikulumMapel.kategori_kelas_id == kategori.kategori_kelas_id,
                KurikulumMapel.tahun_ajaran_id == kategori.tahun_ajaran_id,
                KurikulumMapel.is_active.is_(True),
            )
            .values(is_active=False)
        )

        await self.db.execute(
            update(GuruMapel)
            .where(
                GuruMapel.kelas_id.in_(kelas_ids_subq),
                GuruMapel.tahun_ajaran_id == kategori.tahun_ajaran_id,
                GuruMapel.is_active.is_(True),
            )
            .values(is_active=False)
        )

        await self.db.execute(
            update(Jadwal)
            .where(
                Jadwal.kelas_id.in_(kelas_ids_subq),
                Jadwal.semester_id.in_(semester_ids_subq),
                Jadwal.is_active.is_(True),
            )
            .values(is_active=False)
        )

        await self.db.execute(
            update(Tugas)
            .where(
                Tugas.kelas_id.in_(kelas_ids_subq),
                Tugas.semester_id.in_(semester_ids_subq),
            )
            .values(
                is_archived_context=True,
                is_published_to_students=False,
                is_nilai_published_to_students=False,
            )
        )

    async def count_kelas_usage(self, kategori_kelas_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Kelas.kelas_id)).where(
                Kelas.kategori_kelas_id == kategori_kelas_id
            )
        )
        return int(result.scalar_one() or 0)

    async def count_kurikulum_usage(self, kategori_kelas_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(KurikulumMapel.kurikulum_mapel_id)).where(
                KurikulumMapel.kategori_kelas_id == kategori_kelas_id
            )
        )
        return int(result.scalar_one() or 0)
