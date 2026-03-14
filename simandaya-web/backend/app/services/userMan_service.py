from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.siswa_profile import SiswaProfile
from app.models.guru_profile import GuruProfile
from app.enums import UserType

from app.dto.userMan.userman_request import (
    UpdateStudentRequestDTO,
    UpdateGuruRequestDTO,
)
from app.dto.userMan.userman_response import (
    StudentProfileResponseDTO,
    GuruProfileResponseDTO,
    PaginatedStudentsResponse,
    PaginatedTeachersResponse,
    MessageResponseDTO,
)

from app.dto.struktural.struktural_dto import (
    GetStructuralRoleResponseDTO,
    GetStructuralRoleResponseListDTO,
)


class UserManagementService:
    """
    User management service for CRUD on students and teachers.

    Only accessible by Admin.
    Raises:
        HTTPException: 400, 404, 500
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _to_student_dto(self, profile: SiswaProfile) -> StudentProfileResponseDTO:
        return StudentProfileResponseDTO(
            siswa_id=profile.siswa_id,
            nis=profile.nis,
            nama_lengkap=profile.nama_lengkap,
            dob=profile.dob,
            tempat_lahir=profile.tempat_lahir,
            jenis_kelamin=profile.jenis_kelamin,
            alamat=profile.alamat,
            nama_wali=profile.nama_wali,
            nik=profile.nik,
            kelas_jurusan=profile.kelas_jurusan,
            tahun_masuk=profile.tahun_masuk,
            status_siswa=profile.status_siswa,
            kontak=profile.kontak,
            kewarganegaraan=profile.kewarganegaraan,
            is_active=profile.user.is_active if profile.user else False,
        )

    def _to_guru_dto(self, profile: GuruProfile) -> GuruProfileResponseDTO:
        return GuruProfileResponseDTO(
            guru_id=profile.guru_id,
            nip=profile.nip,
            nama_lengkap=profile.nama_lengkap,
            dob=profile.dob,
            tempat_lahir=profile.tempat_lahir,
            jenis_kelamin=profile.jenis_kelamin,
            alamat=profile.alamat,
            nik=profile.nik,
            tahun_masuk=profile.tahun_masuk,
            status_guru=profile.status_guru,
            kontak=profile.kontak,
            kewarganegaraan=profile.kewarganegaraan,
            structural_role=profile.structural_role,
            mata_pelajaran=profile.mata_pelajaran,
            pendidikan_terakhir=profile.pendidikan_terakhir,
            is_active=profile.user.is_active if profile.user else False,
        )

    # ── Student CRUD ─────────────────────────────────────────────────────────

    async def list_students(
        self, skip: int = 0, limit: int = 30, search: Optional[str] = None
    ) -> PaginatedStudentsResponse:
        """
        List student profiles with pagination and optional search.

        Raises:
            HTTPException: 500 if database error
        """
        search_filter = None
        if search:
            pattern = f"%{search}%"
            search_filter = or_(
                SiswaProfile.nis.ilike(pattern),
                SiswaProfile.nama_lengkap.ilike(pattern),
                SiswaProfile.nik.ilike(pattern),
                SiswaProfile.kelas_jurusan.ilike(pattern),
                SiswaProfile.kontak.ilike(pattern),
                SiswaProfile.tempat_lahir.ilike(pattern),
            )

        count_query = select(func.count()).select_from(SiswaProfile)
        data_query = select(SiswaProfile).options(selectinload(SiswaProfile.user))

        if search_filter is not None:
            count_query = count_query.where(search_filter)
            data_query = data_query.where(search_filter)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        result = await self.db.execute(data_query.offset(skip).limit(limit))
        profiles = result.scalars().all()

        return PaginatedStudentsResponse(
            items=[self._to_student_dto(p) for p in profiles],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_student(self, siswa_id: UUID) -> StudentProfileResponseDTO:
        """
        Get a single student profile by ID.

        Raises:
            HTTPException: 404 if student not found
        """
        result = await self.db.execute(
            select(SiswaProfile)
            .options(selectinload(SiswaProfile.user))
            .where(SiswaProfile.siswa_id == siswa_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
            )
        return self._to_student_dto(profile)

    async def update_student(
        self, siswa_id: UUID, request: UpdateStudentRequestDTO
    ) -> StudentProfileResponseDTO:
        """
        Partial update a student profile.

        Raises:
            HTTPException: 404 if student not found
            HTTPException: 400 if NIS conflict
        """
        result = await self.db.execute(
            select(SiswaProfile).where(SiswaProfile.siswa_id == siswa_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
            )

        update_data = request.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
            )

        # Check NIS uniqueness if being changed
        if "nis" in update_data and update_data["nis"] != profile.nis:
            nis_check = await self.db.execute(
                select(SiswaProfile).where(SiswaProfile.nis == update_data["nis"])
            )
            if nis_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"NIS '{update_data['nis']}' already exists",
                )

        for field, value in update_data.items():
            setattr(profile, field, value)

        await self.db.commit()
        await self.db.refresh(profile)
        return self._to_student_dto(profile)

    async def delete_student(self, siswa_id: UUID) -> MessageResponseDTO:
        """
        Delete a student profile and its associated user account.

        Raises:
            HTTPException: 404 if student not found
        """
        result = await self.db.execute(
            select(SiswaProfile).where(SiswaProfile.siswa_id == siswa_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
            )

        # Delete the user row — CASCADE will remove the profile
        user_result = await self.db.execute(
            select(User).where(User.user_id == profile.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            await self.db.delete(user)

        await self.db.commit()
        return MessageResponseDTO(message="Student deleted successfully")

    # ── Guru CRUD ────────────────────────────────────────────────────────────

    async def list_gurus(
        self, skip: int = 0, limit: int = 30, search: Optional[str] = None
    ) -> PaginatedTeachersResponse:
        """
        List teacher profiles with pagination and optional search.

        Raises:
            HTTPException: 500 if database error
        """
        search_filter = None
        if search:
            pattern = f"%{search}%"
            search_filter = or_(
                GuruProfile.nip.ilike(pattern),
                GuruProfile.nama_lengkap.ilike(pattern),
                GuruProfile.nik.ilike(pattern),
                GuruProfile.kontak.ilike(pattern),
                GuruProfile.mata_pelajaran.ilike(pattern),
                GuruProfile.tempat_lahir.ilike(pattern),
            )

        count_query = select(func.count()).select_from(GuruProfile)
        data_query = select(GuruProfile).options(selectinload(GuruProfile.user))

        if search_filter is not None:
            count_query = count_query.where(search_filter)
            data_query = data_query.where(search_filter)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        result = await self.db.execute(data_query.offset(skip).limit(limit))
        profiles = result.scalars().all()

        return PaginatedTeachersResponse(
            items=[self._to_guru_dto(p) for p in profiles],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_guru(self, guru_id: UUID) -> GuruProfileResponseDTO:
        """
        Get a single teacher profile by ID.

        Raises:
            HTTPException: 404 if teacher not found
        """
        result = await self.db.execute(
            select(GuruProfile)
            .options(selectinload(GuruProfile.user))
            .where(GuruProfile.guru_id == guru_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )
        return self._to_guru_dto(profile)

    async def update_guru(
        self, guru_id: UUID, request: UpdateGuruRequestDTO
    ) -> GuruProfileResponseDTO:
        """
        Partial update a teacher profile.

        Raises:
            HTTPException: 404 if teacher not found
            HTTPException: 400 if NIP conflict
        """
        result = await self.db.execute(
            select(GuruProfile).where(GuruProfile.guru_id == guru_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        update_data = request.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
            )

        # Check NIP uniqueness if being changed
        if "nip" in update_data and update_data["nip"] != profile.nip:
            nip_check = await self.db.execute(
                select(GuruProfile).where(GuruProfile.nip == update_data["nip"])
            )
            if nip_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"NIP '{update_data['nip']}' already exists",
                )

        for field, value in update_data.items():
            setattr(profile, field, value)

        await self.db.commit()
        await self.db.refresh(profile)
        return self._to_guru_dto(profile)

    async def delete_guru(self, guru_id: UUID) -> MessageResponseDTO:
        """
        Delete a teacher profile and its associated user account.

        Raises:
            HTTPException: 404 if teacher not found
        """
        result = await self.db.execute(
            select(GuruProfile).where(GuruProfile.guru_id == guru_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        user_result = await self.db.execute(
            select(User).where(User.user_id == profile.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            await self.db.delete(user)

        await self.db.commit()
        return MessageResponseDTO(message="Teacher deleted successfully")

    def _to_structural_role_dto(
        self, profile: GuruProfile
    ) -> GetStructuralRoleResponseDTO:
        return GetStructuralRoleResponseDTO(
            guru_id=profile.guru_id,
            nip=profile.nip,
            nama_lengkap=profile.nama_lengkap,
            structural_role=profile.structural_role,
            user_type=profile.user.user_type if profile.user else UserType.guru,
        )

    async def get_struktur_guru(self) -> GetStructuralRoleResponseListDTO:
        """
        Get all gurus with their structural roles.
        """
        result = await self.db.execute(
            select(GuruProfile).options(selectinload(GuruProfile.user))
        )
        profiles = result.scalars().all()
        return GetStructuralRoleResponseListDTO(
            list_of_struct=[self._to_structural_role_dto(p) for p in profiles]
        )
