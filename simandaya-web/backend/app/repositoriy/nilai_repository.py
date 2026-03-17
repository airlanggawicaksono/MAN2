from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.guru_mapel import GuruMapel
from app.models.mata_pelajaran import MataPelajaran
from app.models.nilai import Nilai
from app.models.siswa_kelas import SiswaKelas
from app.models.tugas import Tugas
from app.models.user import User


class NilaiRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_tugas_by_id(self, tugas_id: UUID) -> Tugas | None:
        result = await self.db.execute(select(Tugas).where(Tugas.tugas_id == tugas_id))
        return result.scalar_one_or_none()

    async def find_nilai_by_id(self, nilai_id: UUID) -> Nilai | None:
        result = await self.db.execute(select(Nilai).where(Nilai.nilai_id == nilai_id))
        return result.scalar_one_or_none()

    async def find_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()

    async def find_guru_assignment(self, user_id: UUID, kelas_id: UUID, mapel_id: UUID) -> GuruMapel | None:
        result = await self.db.execute(
            select(GuruMapel).where(
                and_(
                    GuruMapel.user_id == user_id,
                    GuruMapel.kelas_id == kelas_id,
                    GuruMapel.mapel_id == mapel_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def find_student_in_kelas(self, user_id: UUID, kelas_id: UUID) -> SiswaKelas | None:
        result = await self.db.execute(
            select(SiswaKelas).where(
                and_(
                    SiswaKelas.user_id == user_id,
                    SiswaKelas.kelas_id == kelas_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def find_nilai_by_tugas_and_user(self, tugas_id: UUID, user_id: UUID) -> Nilai | None:
        result = await self.db.execute(
            select(Nilai).where(
                and_(
                    Nilai.tugas_id == tugas_id,
                    Nilai.user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_nilai_by_tugas(self, tugas_id: UUID) -> list[Nilai]:
        result = await self.db.execute(select(Nilai).where(Nilai.tugas_id == tugas_id))
        return list(result.scalars().all())

    async def list_nilai_by_user(
        self, user_id: UUID, semester_id: UUID | None = None
    ) -> list[Nilai]:
        if semester_id:
            result = await self.db.execute(
                select(Nilai)
                .join(Tugas, Nilai.tugas_id == Tugas.tugas_id)
                .where(
                    and_(
                        Nilai.user_id == user_id,
                        Tugas.semester_id == semester_id,
                    )
                )
            )
        else:
            result = await self.db.execute(select(Nilai).where(Nilai.user_id == user_id))
        return list(result.scalars().all())

    async def list_nilai_by_user_with_mapel(
        self, user_id: UUID, semester_id: UUID | None = None
    ) -> list[tuple[Nilai, UUID, str]]:
        stmt = (
            select(Nilai, MataPelajaran.mapel_id, MataPelajaran.nama_mapel)
            .join(Tugas, Nilai.tugas_id == Tugas.tugas_id)
            .join(MataPelajaran, Tugas.mapel_id == MataPelajaran.mapel_id)
            .where(Nilai.user_id == user_id)
        )
        if semester_id:
            stmt = stmt.where(Tugas.semester_id == semester_id)

        result = await self.db.execute(stmt.order_by(MataPelajaran.nama_mapel))
        return list(result.all())

    async def add_nilai(self, nilai: Nilai) -> None:
        self.db.add(nilai)

    async def delete_nilai(self, nilai: Nilai) -> None:
        await self.db.delete(nilai)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, obj) -> None:
        await self.db.refresh(obj)
