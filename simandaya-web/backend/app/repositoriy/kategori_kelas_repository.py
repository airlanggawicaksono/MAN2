from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.kategori_kelas import KategoriKelas


class KategoriKelasRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(self) -> list[KategoriKelas]:
        result = await self.db.execute(
            select(KategoriKelas).order_by(KategoriKelas.nama.asc())
        )
        return list(result.scalars().all())

    async def find_by_id(self, kategori_kelas_id: UUID) -> KategoriKelas | None:
        result = await self.db.execute(
            select(KategoriKelas).where(KategoriKelas.kategori_kelas_id == kategori_kelas_id)
        )
        return result.scalar_one_or_none()

    async def find_by_kode(self, kode: str) -> KategoriKelas | None:
        result = await self.db.execute(select(KategoriKelas).where(KategoriKelas.kode == kode))
        return result.scalar_one_or_none()

    async def find_by_nama(self, nama: str) -> KategoriKelas | None:
        result = await self.db.execute(select(KategoriKelas).where(KategoriKelas.nama == nama))
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
