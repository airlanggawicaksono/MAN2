from typing import Optional, List, Tuple
from datetime import date
from uuid import UUID
from app.models.user import User
from app.models.siswa_profile import SiswaProfile
from app.models.guru_profile import GuruProfile

from app.dto.registration.registration_dto import PreRegisterResponseDTO, PreRegisterTeacherDTO

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.enums import RegistrationStatus, UserType
from app.models.guru_profile import GuruProfile
from app.models.siswa_profile import SiswaProfile
from app.models.user import User


class RegistrationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_student_profile_by_nis_with_user(self, nis: str) -> SiswaProfile | None:
        result = await self.db.execute(
            select(SiswaProfile).options(joinedload(SiswaProfile.user)).where(SiswaProfile.nis == nis)
        )
        return result.scalar_one_or_none()

    async def get_teacher_profile_by_nip_with_user(self, nip: str) -> GuruProfile | None:
        result = await self.db.execute(
            select(GuruProfile).options(joinedload(GuruProfile.user)).where(GuruProfile.nip == nip)
        )
        return result.scalar_one_or_none()

    async def is_username_taken(self, username: str) -> bool:
        result = await self.db.execute(select(User.user_id).where(User.username == username))
        return result.scalar_one_or_none() is not None

    async def is_nis_taken(self, nis: str) -> bool:
        result = await self.db.execute(select(SiswaProfile.siswa_id).where(SiswaProfile.nis == nis))
        return result.scalar_one_or_none() is not None

    async def is_nip_taken(self, nip: str) -> bool:
        result = await self.db.execute(select(GuruProfile.guru_id).where(GuruProfile.nip == nip))
        return result.scalar_one_or_none() is not None

    async def create_pending_user(self, user_type: UserType) -> User:
        user = User(
            user_type=user_type,
            registration_status=RegistrationStatus.pending,
            username=None,
            password_hash=None,
            is_active=False,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def add_student_profile(self, profile: SiswaProfile) -> None:
        self.db.add(profile)

    async def add_teacher_profile(self, profile: GuruProfile) -> None:
        self.db.add(profile)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()
