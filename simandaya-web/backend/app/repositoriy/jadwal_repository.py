from uuid import UUID
from datetime import time

from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.guru_mapel import GuruMapel
from app.models.jadwal import Jadwal
from app.models.kelas import Kelas
from app.models.mata_pelajaran import MataPelajaran
from app.models.semester import Semester
from app.models.siswa_kelas import SiswaKelas
from app.models.slot_waktu import SlotWaktu
from app.models.tahun_ajaran import TahunAjaran
from app.models.user import User


class JadwalRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()

    async def find_mapel_by_id(self, mapel_id: UUID) -> MataPelajaran | None:
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.mapel_id == mapel_id)
        )
        return result.scalar_one_or_none()

    async def find_kelas_by_id(self, kelas_id: UUID) -> Kelas | None:
        result = await self.db.execute(select(Kelas).where(Kelas.kelas_id == kelas_id))
        return result.scalar_one_or_none()

    async def find_tahun_ajaran_by_id(self, tahun_ajaran_id: UUID) -> TahunAjaran | None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.tahun_ajaran_id == tahun_ajaran_id)
        )
        return result.scalar_one_or_none()

    async def find_semester_by_id(self, semester_id: UUID) -> Semester | None:
        result = await self.db.execute(
            select(Semester).where(Semester.semester_id == semester_id)
        )
        return result.scalar_one_or_none()

    async def find_slot_waktu_by_id(self, slot_waktu_id: UUID) -> SlotWaktu | None:
        result = await self.db.execute(
            select(SlotWaktu).where(SlotWaktu.slot_id == slot_waktu_id)
        )
        return result.scalar_one_or_none()

    async def find_guru_mapel_unique(
        self, user_id: UUID, mapel_id: UUID, kelas_id: UUID, tahun_ajaran_id: UUID
    ) -> GuruMapel | None:
        result = await self.db.execute(
            select(GuruMapel).where(
                and_(
                    GuruMapel.user_id == user_id,
                    GuruMapel.mapel_id == mapel_id,
                    GuruMapel.kelas_id == kelas_id,
                    GuruMapel.tahun_ajaran_id == tahun_ajaran_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def add_guru_mapel(self, guru_mapel: GuruMapel) -> None:
        self.db.add(guru_mapel)

    async def find_guru_mapel_by_id(self, guru_mapel_id: UUID) -> GuruMapel | None:
        result = await self.db.execute(
            select(GuruMapel).where(GuruMapel.guru_mapel_id == guru_mapel_id)
        )
        return result.scalar_one_or_none()

    async def find_guru_mapel_by_id_with_relations(
        self, guru_mapel_id: UUID
    ) -> GuruMapel | None:
        result = await self.db.execute(
            select(GuruMapel)
            .where(GuruMapel.guru_mapel_id == guru_mapel_id)
            .options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        return result.scalar_one_or_none()

    async def list_guru_mapel_all(self) -> list[GuruMapel]:
        result = await self.db.execute(
            select(GuruMapel).options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        return list(result.scalars().all())

    async def list_guru_mapel_active_tahun(self) -> list[GuruMapel]:
        result = await self.db.execute(
            select(GuruMapel)
            .join(TahunAjaran, TahunAjaran.tahun_ajaran_id == GuruMapel.tahun_ajaran_id)
            .where(TahunAjaran.is_active.is_(True))
            .options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        return list(result.scalars().all())

    async def list_guru_mapel_by_guru(self, user_id: UUID) -> list[GuruMapel]:
        result = await self.db.execute(
            select(GuruMapel)
            .where(GuruMapel.user_id == user_id)
            .options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        return list(result.scalars().all())

    async def list_guru_mapel_by_kelas(self, kelas_id: UUID) -> list[GuruMapel]:
        result = await self.db.execute(
            select(GuruMapel)
            .where(GuruMapel.kelas_id == kelas_id)
            .options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        return list(result.scalars().all())

    async def delete_guru_mapel(self, guru_mapel: GuruMapel) -> None:
        await self.db.delete(guru_mapel)

    async def refresh_guru_mapel(self, guru_mapel: GuruMapel) -> None:
        await self.db.refresh(guru_mapel)

    async def sync_jadwal_teacher_for_assignment(
        self,
        tahun_ajaran_id: UUID,
        kelas_id: UUID,
        mapel_id: UUID,
        old_user_id: UUID,
        new_user_id: UUID,
    ) -> None:
        semester_ids_subq = select(Semester.semester_id).where(
            Semester.tahun_ajaran_id == tahun_ajaran_id
        )
        await self.db.execute(
            update(Jadwal)
            .where(
                Jadwal.semester_id.in_(semester_ids_subq),
                Jadwal.kelas_id == kelas_id,
                Jadwal.mapel_id == mapel_id,
                Jadwal.guru_user_id == old_user_id,
            )
            .values(guru_user_id=new_user_id)
        )

    async def find_class_clash(
        self,
        semester_id: UUID,
        hari,
        slot_waktu_id: UUID,
        kelas_id: UUID,
        exclude_jadwal_id: UUID | None = None,
    ) -> Jadwal | None:
        filters = [
            Jadwal.semester_id == semester_id,
            Jadwal.hari == hari,
            Jadwal.slot_waktu_id == slot_waktu_id,
            Jadwal.kelas_id == kelas_id,
        ]
        if exclude_jadwal_id:
            filters.append(Jadwal.jadwal_id != exclude_jadwal_id)
        result = await self.db.execute(select(Jadwal).where(and_(*filters)))
        return result.scalar_one_or_none()

    async def find_teacher_clash(
        self,
        semester_id: UUID,
        hari,
        slot_waktu_id: UUID,
        guru_user_id: UUID,
        exclude_jadwal_id: UUID | None = None,
    ) -> Jadwal | None:
        filters = [
            Jadwal.semester_id == semester_id,
            Jadwal.hari == hari,
            Jadwal.slot_waktu_id == slot_waktu_id,
            Jadwal.guru_user_id == guru_user_id,
        ]
        if exclude_jadwal_id:
            filters.append(Jadwal.jadwal_id != exclude_jadwal_id)
        result = await self.db.execute(select(Jadwal).where(and_(*filters)))
        return result.scalar_one_or_none()

    async def find_class_time_overlap(
        self,
        semester_id: UUID,
        hari,
        kelas_id: UUID,
        jam_mulai: time,
        jam_selesai: time,
        exclude_jadwal_id: UUID | None = None,
    ) -> Jadwal | None:
        filters = [
            Jadwal.semester_id == semester_id,
            Jadwal.hari == hari,
            Jadwal.kelas_id == kelas_id,
            SlotWaktu.jam_mulai < jam_selesai,
            SlotWaktu.jam_selesai > jam_mulai,
        ]
        if exclude_jadwal_id:
            filters.append(Jadwal.jadwal_id != exclude_jadwal_id)
        result = await self.db.execute(
            select(Jadwal).join(SlotWaktu, SlotWaktu.slot_id == Jadwal.slot_waktu_id).where(and_(*filters))
        )
        return result.scalar_one_or_none()

    async def find_teacher_time_overlap(
        self,
        semester_id: UUID,
        hari,
        guru_user_id: UUID,
        jam_mulai: time,
        jam_selesai: time,
        exclude_jadwal_id: UUID | None = None,
    ) -> Jadwal | None:
        filters = [
            Jadwal.semester_id == semester_id,
            Jadwal.hari == hari,
            Jadwal.guru_user_id == guru_user_id,
            SlotWaktu.jam_mulai < jam_selesai,
            SlotWaktu.jam_selesai > jam_mulai,
        ]
        if exclude_jadwal_id:
            filters.append(Jadwal.jadwal_id != exclude_jadwal_id)
        result = await self.db.execute(
            select(Jadwal).join(SlotWaktu, SlotWaktu.slot_id == Jadwal.slot_waktu_id).where(and_(*filters))
        )
        return result.scalar_one_or_none()

    async def add_jadwal(self, jadwal: Jadwal) -> None:
        self.db.add(jadwal)

    async def find_jadwal_by_id(self, jadwal_id: UUID) -> Jadwal | None:
        result = await self.db.execute(
            select(Jadwal)
            .where(Jadwal.jadwal_id == jadwal_id)
            .options(
                selectinload(Jadwal.mapel),
                selectinload(Jadwal.kelas),
                selectinload(Jadwal.slot_waktu),
                selectinload(Jadwal.guru).selectinload(User.guru_profile),
            )
        )
        return result.scalar_one_or_none()

    async def list_jadwal_by_semester(self, semester_id: UUID) -> list[Jadwal]:
        result = await self.db.execute(
            select(Jadwal)
            .where(Jadwal.semester_id == semester_id)
            .options(
                selectinload(Jadwal.mapel),
                selectinload(Jadwal.kelas),
                selectinload(Jadwal.slot_waktu),
                selectinload(Jadwal.guru).selectinload(User.guru_profile),
            )
        )
        return list(result.scalars().all())

    async def list_jadwal_by_kelas(self, kelas_id: UUID) -> list[Jadwal]:
        result = await self.db.execute(
            select(Jadwal)
            .where(Jadwal.kelas_id == kelas_id)
            .options(
                selectinload(Jadwal.mapel),
                selectinload(Jadwal.kelas),
                selectinload(Jadwal.slot_waktu),
                selectinload(Jadwal.guru).selectinload(User.guru_profile),
            )
        )
        return list(result.scalars().all())

    async def list_jadwal_by_guru(self, user_id: UUID) -> list[Jadwal]:
        result = await self.db.execute(
            select(Jadwal)
            .where(Jadwal.guru_user_id == user_id)
            .options(
                selectinload(Jadwal.mapel),
                selectinload(Jadwal.kelas),
                selectinload(Jadwal.slot_waktu),
                selectinload(Jadwal.guru).selectinload(User.guru_profile),
            )
        )
        return list(result.scalars().all())

    async def find_student_kelas_id(self, user_id: UUID) -> UUID | None:
        result = await self.db.execute(
            select(SiswaKelas.kelas_id).where(SiswaKelas.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def delete_jadwal(self, jadwal: Jadwal) -> None:
        await self.db.delete(jadwal)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, obj) -> None:
        await self.db.refresh(obj)
