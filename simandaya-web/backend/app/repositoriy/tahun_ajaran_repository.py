from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tahun_ajaran import TahunAjaran


class TahunAjaranRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_nama(self, nama: str) -> TahunAjaran | None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.nama == nama)
        )
        return result.scalar_one_or_none()

    async def find_by_id(self, tahun_ajaran_id: UUID) -> TahunAjaran | None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.tahun_ajaran_id == tahun_ajaran_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[TahunAjaran]:
        result = await self.db.execute(select(TahunAjaran))
        return list(result.scalars().all())

    async def find_active(self) -> TahunAjaran | None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.is_active.is_(True))
        )
        return result.scalar_one_or_none()

    async def add(self, tahun_ajaran: TahunAjaran) -> None:
        self.db.add(tahun_ajaran)

    async def delete(self, tahun_ajaran: TahunAjaran) -> None:
        await self.db.delete(tahun_ajaran)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, tahun_ajaran: TahunAjaran) -> None:
        await self.db.refresh(tahun_ajaran)
