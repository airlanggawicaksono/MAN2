from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.guru_mapel import GuruMapel
from app.models.jadwal import Jadwal
from app.models.kurikulum_mapel import KurikulumMapel
from app.models.mata_pelajaran import MataPelajaran
from app.models.rapor import RaporNilai
from app.models.rapor_bobot import RaporBobot
from app.models.semester import Semester
from app.models.tugas import Tugas


class MapelRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_kode(self, kode_mapel: str, tahun_ajaran_id: UUID) -> MataPelajaran | None:
        result = await self.db.execute(
            select(MataPelajaran).where(
                MataPelajaran.kode_mapel == kode_mapel,
                MataPelajaran.tahun_ajaran_id == tahun_ajaran_id,
            )
        )
        return result.scalar_one_or_none()

    async def find_by_id(self, mapel_id: UUID) -> MataPelajaran | None:
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.mapel_id == mapel_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        status: str = "available",
        tahun_ajaran_id: UUID | None = None,
    ) -> list[MataPelajaran]:
        query = select(MataPelajaran)
        if tahun_ajaran_id:
            query = query.where(MataPelajaran.tahun_ajaran_id == tahun_ajaran_id)
        if status == "available":
            query = query.where(MataPelajaran.is_active.is_(True))
        elif status == "archived":
            query = query.where(MataPelajaran.is_active.is_(False))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add(self, mapel: MataPelajaran) -> None:
        self.db.add(mapel)

    async def delete(self, mapel: MataPelajaran) -> None:
        await self.db.delete(mapel)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, mapel: MataPelajaran) -> None:
        await self.db.refresh(mapel)

    async def detach_active_relations_for_archived_mapel(self, mapel: MataPelajaran) -> None:
        semester_ids_subq = select(Semester.semester_id).where(
            Semester.tahun_ajaran_id == mapel.tahun_ajaran_id
        )

        await self.db.execute(
            update(KurikulumMapel)
            .where(
                KurikulumMapel.mapel_id == mapel.mapel_id,
                KurikulumMapel.tahun_ajaran_id == mapel.tahun_ajaran_id,
                KurikulumMapel.is_active.is_(True),
            )
            .values(is_active=False)
        )

        await self.db.execute(
            update(GuruMapel)
            .where(
                GuruMapel.mapel_id == mapel.mapel_id,
                GuruMapel.tahun_ajaran_id == mapel.tahun_ajaran_id,
                GuruMapel.is_active.is_(True),
            )
            .values(is_active=False)
        )

        await self.db.execute(
            update(Jadwal)
            .where(
                Jadwal.mapel_id == mapel.mapel_id,
                Jadwal.semester_id.in_(semester_ids_subq),
                Jadwal.is_active.is_(True),
            )
            .values(is_active=False)
        )

        await self.db.execute(
            update(Tugas)
            .where(
                Tugas.mapel_id == mapel.mapel_id,
                Tugas.semester_id.in_(semester_ids_subq),
            )
            .values(
                is_archived_context=True,
                is_published_to_students=False,
                is_nilai_published_to_students=False,
            )
        )

    async def count_kurikulum_usage(self, mapel_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(KurikulumMapel.kurikulum_mapel_id)).where(
                KurikulumMapel.mapel_id == mapel_id
            )
        )
        return int(result.scalar_one() or 0)

    async def count_guru_mapel_usage(self, mapel_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(GuruMapel.guru_mapel_id)).where(
                GuruMapel.mapel_id == mapel_id
            )
        )
        return int(result.scalar_one() or 0)

    async def count_jadwal_usage(self, mapel_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Jadwal.jadwal_id)).where(
                Jadwal.mapel_id == mapel_id
            )
        )
        return int(result.scalar_one() or 0)

    async def count_tugas_usage(self, mapel_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Tugas.tugas_id)).where(
                Tugas.mapel_id == mapel_id
            )
        )
        return int(result.scalar_one() or 0)

    async def count_rapor_nilai_usage(self, mapel_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(RaporNilai.rapor_nilai_id)).where(
                RaporNilai.mapel_id == mapel_id
            )
        )
        return int(result.scalar_one() or 0)

    async def count_rapor_bobot_usage(self, mapel_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(RaporBobot.rapor_bobot_id)).where(
                RaporBobot.mapel_id == mapel_id
            )
        )
        return int(result.scalar_one() or 0)
