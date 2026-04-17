from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.guru_profile import GuruProfile
from app.models.guru_structural_assignment import GuruStructuralAssignment
from app.models.siswa_profile import SiswaProfile
from app.models.structural_role_ref import StructuralRoleRef
from app.models.user import User


class UserManagementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def count_students(self, search: Optional[str] = None) -> int:
        query = select(func.count()).select_from(SiswaProfile)
        search_filter = self._student_search_filter(search)
        if search_filter is not None:
            query = query.join(User, User.user_id == SiswaProfile.user_id)
            query = query.where(search_filter)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def list_students(
        self, skip: int = 0, limit: int = 30, search: Optional[str] = None
    ) -> list[SiswaProfile]:
        query = select(SiswaProfile).options(selectinload(SiswaProfile.user))
        search_filter = self._student_search_filter(search)
        if search_filter is not None:
            query = query.join(User, User.user_id == SiswaProfile.user_id)
            query = query.where(search_filter)
        result = await self.db.execute(query.offset(skip).limit(limit))
        return list(result.scalars().all())

    async def find_student_by_id_with_user(self, siswa_id: UUID) -> SiswaProfile | None:
        result = await self.db.execute(
            select(SiswaProfile)
            .options(selectinload(SiswaProfile.user))
            .where(SiswaProfile.siswa_id == siswa_id)
        )
        return result.scalar_one_or_none()

    async def find_student_by_user_id_with_user(self, user_id: UUID) -> SiswaProfile | None:
        result = await self.db.execute(
            select(SiswaProfile)
            .options(selectinload(SiswaProfile.user))
            .where(SiswaProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def find_student_by_id(self, siswa_id: UUID) -> SiswaProfile | None:
        result = await self.db.execute(
            select(SiswaProfile).where(SiswaProfile.siswa_id == siswa_id)
        )
        return result.scalar_one_or_none()

    async def find_student_by_nis(self, nis: str) -> SiswaProfile | None:
        result = await self.db.execute(
            select(SiswaProfile).where(SiswaProfile.nis == nis)
        )
        return result.scalar_one_or_none()

    async def count_teachers(self, search: Optional[str] = None) -> int:
        query = select(func.count()).select_from(GuruProfile)
        search_filter = self._teacher_search_filter(search)
        if search_filter is not None:
            query = query.where(search_filter)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def list_teachers(
        self, skip: int = 0, limit: int = 30, search: Optional[str] = None
    ) -> list[GuruProfile]:
        query = select(GuruProfile).options(selectinload(GuruProfile.user))
        search_filter = self._teacher_search_filter(search)
        if search_filter is not None:
            query = query.where(search_filter)
        result = await self.db.execute(query.offset(skip).limit(limit))
        return list(result.scalars().all())

    async def find_teacher_by_id_with_user(self, guru_id: UUID) -> GuruProfile | None:
        result = await self.db.execute(
            select(GuruProfile)
            .options(selectinload(GuruProfile.user))
            .where(GuruProfile.guru_id == guru_id)
        )
        return result.scalar_one_or_none()

    async def find_teacher_by_user_id_with_user(self, user_id: UUID) -> GuruProfile | None:
        result = await self.db.execute(
            select(GuruProfile)
            .options(selectinload(GuruProfile.user))
            .where(GuruProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def find_teacher_by_id(self, guru_id: UUID) -> GuruProfile | None:
        result = await self.db.execute(
            select(GuruProfile).where(GuruProfile.guru_id == guru_id)
        )
        return result.scalar_one_or_none()

    async def find_teacher_by_nip(self, nip: str) -> GuruProfile | None:
        result = await self.db.execute(
            select(GuruProfile).where(GuruProfile.nip == nip)
        )
        return result.scalar_one_or_none()

    async def list_all_teachers_with_user(self) -> list[GuruProfile]:
        result = await self.db.execute(
            select(GuruProfile).options(selectinload(GuruProfile.user))
        )
        return list(result.scalars().all())

    async def count_public_civitas(self, search: Optional[str] = None) -> int:
        query = select(func.count()).select_from(GuruProfile)
        search_filter = self._public_civitas_search_filter(search)
        if search_filter is not None:
            query = query.where(search_filter)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def list_public_civitas(
        self, skip: int = 0, limit: int = 100, search: Optional[str] = None
    ) -> list[GuruProfile]:
        query = select(GuruProfile)
        search_filter = self._public_civitas_search_filter(search)
        if search_filter is not None:
            query = query.where(search_filter)
        result = await self.db.execute(query.offset(skip).limit(limit))
        return list(result.scalars().all())

    async def find_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()

    async def list_structural_role_refs(self, include_inactive: bool = False) -> list[StructuralRoleRef]:
        query = select(StructuralRoleRef).order_by(StructuralRoleRef.name)
        if not include_inactive:
            query = query.where(StructuralRoleRef.is_active.is_(True))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def find_structural_role_ref_by_id(self, role_id: UUID) -> StructuralRoleRef | None:
        result = await self.db.execute(
            select(StructuralRoleRef).where(StructuralRoleRef.role_id == role_id)
        )
        return result.scalar_one_or_none()

    async def find_structural_role_ref_by_code(self, code: str) -> StructuralRoleRef | None:
        result = await self.db.execute(
            select(StructuralRoleRef).where(StructuralRoleRef.code == code)
        )
        return result.scalar_one_or_none()

    async def add_structural_role_ref(self, role: StructuralRoleRef) -> None:
        self.db.add(role)

    async def add_structural_assignment(self, assignment: GuruStructuralAssignment) -> None:
        self.db.add(assignment)

    async def list_teacher_structural_assignments(
        self, user_id: UUID, active_only: bool = False
    ) -> list[GuruStructuralAssignment]:
        query = (
            select(GuruStructuralAssignment)
            .options(selectinload(GuruStructuralAssignment.role))
            .where(GuruStructuralAssignment.user_id == user_id)
            .order_by(GuruStructuralAssignment.start_date.desc())
        )
        if active_only:
            query = query.where(GuruStructuralAssignment.is_active.is_(True))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def find_teacher_structural_assignment_by_id(
        self, assignment_id: UUID
    ) -> GuruStructuralAssignment | None:
        result = await self.db.execute(
            select(GuruStructuralAssignment)
            .options(selectinload(GuruStructuralAssignment.role))
            .where(GuruStructuralAssignment.assignment_id == assignment_id)
        )
        return result.scalar_one_or_none()

    async def list_active_structural_assignments(self) -> list[GuruStructuralAssignment]:
        result = await self.db.execute(
            select(GuruStructuralAssignment).where(GuruStructuralAssignment.is_active.is_(True))
        )
        return list(result.scalars().all())

    async def find_active_structural_assignment_by_role_id(
        self, role_id: UUID
    ) -> GuruStructuralAssignment | None:
        result = await self.db.execute(
            select(GuruStructuralAssignment)
            .options(selectinload(GuruStructuralAssignment.role))
            .where(
                GuruStructuralAssignment.role_id == role_id,
                GuruStructuralAssignment.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def delete_user(self, user: User) -> None:
        await self.db.delete(user)

    async def delete_student_profile(self, profile: SiswaProfile) -> None:
        await self.db.delete(profile)

    async def delete_teacher_profile(self, profile: GuruProfile) -> None:
        await self.db.delete(profile)

    async def commit(self) -> None:
        await self.db.commit()

    async def refresh(self, obj) -> None:
        await self.db.refresh(obj)

    async def rollback(self) -> None:
        await self.db.rollback()

    @staticmethod
    def _student_search_filter(search: Optional[str]):
        if not search:
            return None
        pattern = f"%{search}%"
        return or_(
            SiswaProfile.nis.ilike(pattern),
            User.username.ilike(pattern),
            SiswaProfile.nama_lengkap.ilike(pattern),
            SiswaProfile.kelas_jurusan.ilike(pattern),
            SiswaProfile.kontak.ilike(pattern),
            SiswaProfile.tempat_lahir.ilike(pattern),
        )

    @staticmethod
    def _teacher_search_filter(search: Optional[str]):
        if not search:
            return None
        pattern = f"%{search}%"
        return or_(
            GuruProfile.nip.ilike(pattern),
            GuruProfile.nama_lengkap.ilike(pattern),
            GuruProfile.nik.ilike(pattern),
            GuruProfile.kontak.ilike(pattern),
            GuruProfile.mata_pelajaran.ilike(pattern),
            GuruProfile.tempat_lahir.ilike(pattern),
        )

    @staticmethod
    def _public_civitas_search_filter(search: Optional[str]):
        if not search:
            return None
        pattern = f"%{search}%"
        return or_(
            GuruProfile.nama_lengkap.ilike(pattern),
            GuruProfile.nip.ilike(pattern),
            GuruProfile.nik.ilike(pattern),
            GuruProfile.mata_pelajaran.ilike(pattern),
        )
