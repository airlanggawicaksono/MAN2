from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums import TingkatKelas
from app.models.kurikulum_mapel import KurikulumMapel
from app.models.mata_pelajaran import MataPelajaran
from app.models.tahun_ajaran import TahunAjaran


class KurikulumRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_mapel_by_id(self, mapel_id: UUID) -> MataPelajaran | None:
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.mapel_id == mapel_id)
        )
        return result.scalar_one_or_none()

    async def find_tahun_ajaran_by_id(self, tahun_ajaran_id: UUID) -> TahunAjaran | None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.tahun_ajaran_id == tahun_ajaran_id)
        )
        return result.scalar_one_or_none()

    async def find_assignment(
        self, mapel_id: UUID, tingkat: TingkatKelas, tahun_ajaran_id: UUID
    ) -> KurikulumMapel | None:
        result = await self.db.execute(
            select(KurikulumMapel).where(
                KurikulumMapel.mapel_id == mapel_id,
                KurikulumMapel.tingkat == tingkat,
                KurikulumMapel.tahun_ajaran_id == tahun_ajaran_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_assignment(self, km: KurikulumMapel) -> None:
        self.db.add(km)

    async def find_kurikulum_mapel_by_id(self, kurikulum_mapel_id: UUID) -> KurikulumMapel | None:
        result = await self.db.execute(
            select(KurikulumMapel).where(KurikulumMapel.kurikulum_mapel_id == kurikulum_mapel_id)
        )
        return result.scalar_one_or_none()

    async def list_by_tahun_ajaran_and_tingkat(
        self, tahun_ajaran_id: UUID, tingkat: TingkatKelas
    ) -> list[KurikulumMapel]:
        result = await self.db.execute(
            select(KurikulumMapel).where(
                KurikulumMapel.tahun_ajaran_id == tahun_ajaran_id,
                KurikulumMapel.tingkat == tingkat,
            )
        )
        return list(result.scalars().all())

    async def list_by_tahun_ajaran(self, tahun_ajaran_id: UUID) -> list[KurikulumMapel]:
        result = await self.db.execute(
            select(KurikulumMapel).where(KurikulumMapel.tahun_ajaran_id == tahun_ajaran_id)
        )
        return list(result.scalars().all())

    async def delete_assignment(self, km: KurikulumMapel) -> None:
        await self.db.delete(km)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, obj) -> None:
        await self.db.refresh(obj)
