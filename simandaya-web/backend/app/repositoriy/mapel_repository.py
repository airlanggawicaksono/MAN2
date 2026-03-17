from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mata_pelajaran import MataPelajaran


class MapelRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_kode(self, kode_mapel: str) -> MataPelajaran | None:
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.kode_mapel == kode_mapel)
        )
        return result.scalar_one_or_none()

    async def find_by_id(self, mapel_id: UUID) -> MataPelajaran | None:
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.mapel_id == mapel_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[MataPelajaran]:
        result = await self.db.execute(select(MataPelajaran))
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
