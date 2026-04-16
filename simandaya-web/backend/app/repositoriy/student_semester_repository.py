from __future__ import annotations

from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.kelas import Kelas
from app.models.semester import Semester
from app.models.siswa_kelas import SiswaKelas
from app.models.tahun_ajaran import TahunAjaran


class StudentSemesterRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_student_semester_rows(self, user_id: UUID):
        result = await self.db.execute(
            select(
                Kelas.tingkat,
                Semester.tipe,
                Semester.semester_id,
                Semester.tahun_ajaran_id,
                TahunAjaran.nama,
                Kelas.kelas_id,
                Kelas.nama_kelas,
                TahunAjaran.tanggal_mulai,
            )
            .join(SiswaKelas, SiswaKelas.kelas_id == Kelas.kelas_id)
            .join(TahunAjaran, TahunAjaran.tahun_ajaran_id == Kelas.tahun_ajaran_id)
            .join(Semester, Semester.tahun_ajaran_id == Kelas.tahun_ajaran_id)
            .where(SiswaKelas.user_id == user_id)
            .order_by(TahunAjaran.tanggal_mulai.desc(), Semester.tanggal_mulai.desc())
        )
        return result.all()

    async def is_student_allowed_semester(self, user_id: UUID, semester_id: UUID) -> bool:
        result = await self.db.execute(
            select(SiswaKelas.siswa_kelas_id)
            .join(Kelas, Kelas.kelas_id == SiswaKelas.kelas_id)
            .join(Semester, Semester.tahun_ajaran_id == Kelas.tahun_ajaran_id)
            .where(
                and_(
                    SiswaKelas.user_id == user_id,
                    Semester.semester_id == semester_id,
                    Kelas.is_active.is_(True),
                )
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def find_active_semester_for_student(self, user_id: UUID) -> UUID | None:
        result = await self.db.execute(
            select(Semester.semester_id)
            .join(Kelas, Kelas.tahun_ajaran_id == Semester.tahun_ajaran_id)
            .join(SiswaKelas, SiswaKelas.kelas_id == Kelas.kelas_id)
            .where(
                and_(
                    SiswaKelas.user_id == user_id,
                    Semester.is_active.is_(True),
                    Kelas.is_active.is_(True),
                )
            )
            .order_by(Semester.tanggal_mulai.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_primary_kelas_for_semester(
        self, user_id: UUID, semester_id: UUID
    ) -> UUID | None:
        rows = await self.list_student_semester_rows(user_id)
        for (
            _tingkat,
            _tipe,
            row_semester_id,
            _tahun_ajaran_id,
            _tahun_ajaran_nama,
            kelas_id,
            _kelas_nama,
            _tahun_mulai,
        ) in rows:
            if row_semester_id == semester_id and kelas_id is not None:
                return kelas_id
        return None
