from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.struktural.struktural_dto import (
    GetStructuralRoleResponseDTO,
    GetStructuralRoleResponseListDTO,
)
from app.dto.userMan.userman_request import UpdateGuruRequestDTO, UpdateStudentRequestDTO
from app.dto.userMan.userman_response import (
    GuruProfileResponseDTO,
    MessageResponseDTO,
    PaginatedPublicCivitasResponse,
    PaginatedStudentsResponse,
    PaginatedTeachersResponse,
    PublicCivitasResponseDTO,
    StudentProfileResponseDTO,
)
from app.enums import UserType
from app.models.guru_profile import GuruProfile
from app.models.siswa_profile import SiswaProfile
from app.policy.user_management_policy import UserManagementPolicy
from app.repositoriy.user_management_repository import UserManagementRepository


class StudentUserManagementService:
    def __init__(self, repo: UserManagementRepository, policy: type[UserManagementPolicy]):
        self.repo = repo
        self.policy = policy

    async def list_students(
        self, skip: int = 0, limit: int = 30, search: Optional[str] = None
    ) -> PaginatedStudentsResponse:
        total = await self.repo.count_students(search=search)
        profiles = await self.repo.list_students(skip=skip, limit=limit, search=search)
        return PaginatedStudentsResponse(
            items=[self._to_student_dto(p) for p in profiles],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_student(self, siswa_id: UUID) -> StudentProfileResponseDTO:
        profile = await self.repo.find_student_by_id_with_user(siswa_id)
        self.policy.ensure_student_exists(profile, detail="Student not found")
        return self._to_student_dto(profile)

    async def get_student_by_user_id(self, user_id: UUID) -> StudentProfileResponseDTO:
        profile = await self.repo.find_student_by_user_id_with_user(user_id)
        self.policy.ensure_student_exists(profile, detail="Student profile not found")
        return self._to_student_dto(profile)

    async def update_student(
        self, siswa_id: UUID, request: UpdateStudentRequestDTO
    ) -> StudentProfileResponseDTO:
        profile = await self.repo.find_student_by_id(siswa_id)
        self.policy.ensure_student_exists(profile, detail="Student not found")

        update_data = request.model_dump(exclude_unset=True)
        self.policy.ensure_update_payload(update_data)

        if "nis" in update_data and update_data["nis"] != profile.nis:
            nis_check = await self.repo.find_student_by_nis(update_data["nis"])
            self.policy.ensure_nis_available(nis_check is not None, update_data["nis"])

        for field, value in update_data.items():
            setattr(profile, field, value)

        await self.repo.commit()
        await self.repo.refresh(profile)

        profile_with_user = await self.repo.find_student_by_id_with_user(siswa_id)
        self.policy.ensure_student_exists(profile_with_user, detail="Student not found")
        return self._to_student_dto(profile_with_user)

    async def delete_student(self, siswa_id: UUID) -> MessageResponseDTO:
        profile = await self.repo.find_student_by_id(siswa_id)
        self.policy.ensure_student_exists(profile, detail="Student not found")

        user = await self.repo.find_user_by_id(profile.user_id)
        if user:
            await self.repo.delete_user(user)

        await self.repo.commit()
        return MessageResponseDTO(message="Student deleted successfully")

    @staticmethod
    def _to_student_dto(profile: SiswaProfile) -> StudentProfileResponseDTO:
        return StudentProfileResponseDTO(
            siswa_id=profile.siswa_id,
            user_id=profile.user_id,
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


class TeacherUserManagementService:
    def __init__(self, repo: UserManagementRepository, policy: type[UserManagementPolicy]):
        self.repo = repo
        self.policy = policy

    async def list_teachers(
        self, skip: int = 0, limit: int = 30, search: Optional[str] = None
    ) -> PaginatedTeachersResponse:
        total = await self.repo.count_teachers(search=search)
        profiles = await self.repo.list_teachers(skip=skip, limit=limit, search=search)
        return PaginatedTeachersResponse(
            items=[self._to_teacher_dto(p) for p in profiles],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_teacher(self, guru_id: UUID) -> GuruProfileResponseDTO:
        profile = await self.repo.find_teacher_by_id_with_user(guru_id)
        self.policy.ensure_teacher_exists(profile, detail="Teacher not found")
        return self._to_teacher_dto(profile)

    async def get_teacher_by_user_id(self, user_id: UUID) -> GuruProfileResponseDTO:
        profile = await self.repo.find_teacher_by_user_id_with_user(user_id)
        self.policy.ensure_teacher_exists(profile, detail="Teacher profile not found")
        return self._to_teacher_dto(profile)

    async def update_teacher(
        self, guru_id: UUID, request: UpdateGuruRequestDTO
    ) -> GuruProfileResponseDTO:
        profile = await self.repo.find_teacher_by_id(guru_id)
        self.policy.ensure_teacher_exists(profile, detail="Teacher not found")

        update_data = request.model_dump(exclude_unset=True)
        self.policy.ensure_update_payload(update_data)

        if "nip" in update_data and update_data["nip"] != profile.nip:
            nip_check = await self.repo.find_teacher_by_nip(update_data["nip"])
            self.policy.ensure_nip_available(nip_check is not None, update_data["nip"])

        for field, value in update_data.items():
            setattr(profile, field, value)

        await self.repo.commit()
        await self.repo.refresh(profile)

        profile_with_user = await self.repo.find_teacher_by_id_with_user(guru_id)
        self.policy.ensure_teacher_exists(profile_with_user, detail="Teacher not found")
        return self._to_teacher_dto(profile_with_user)

    async def delete_teacher(self, guru_id: UUID) -> MessageResponseDTO:
        profile = await self.repo.find_teacher_by_id(guru_id)
        self.policy.ensure_teacher_exists(profile, detail="Teacher not found")

        user = await self.repo.find_user_by_id(profile.user_id)
        if user:
            await self.repo.delete_user(user)

        await self.repo.commit()
        return MessageResponseDTO(message="Teacher deleted successfully")

    async def get_structural_roles(self) -> GetStructuralRoleResponseListDTO:
        profiles = await self.repo.list_all_teachers_with_user()
        return GetStructuralRoleResponseListDTO(
            list_of_struct=[self._to_structural_role_dto(p) for p in profiles]
        )

    async def list_public_civitas(
        self, skip: int = 0, limit: int = 100, search: Optional[str] = None
    ) -> PaginatedPublicCivitasResponse:
        total = await self.repo.count_public_civitas(search=search)
        profiles = await self.repo.list_public_civitas(skip=skip, limit=limit, search=search)
        return PaginatedPublicCivitasResponse(
            items=[
                PublicCivitasResponseDTO(
                    nama=p.nama_lengkap,
                    nip=p.nip,
                    nik=p.nik,
                    jabatan_struktural=p.structural_role,
                    matapelajaran=p.mata_pelajaran,
                    kontak=p.kontak,
                )
                for p in profiles
            ],
            total=total,
            skip=skip,
            limit=limit,
        )

    @staticmethod
    def _to_teacher_dto(profile: GuruProfile) -> GuruProfileResponseDTO:
        return GuruProfileResponseDTO(
            guru_id=profile.guru_id,
            user_id=profile.user_id,
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

    @staticmethod
    def _to_structural_role_dto(profile: GuruProfile) -> GetStructuralRoleResponseDTO:
        return GetStructuralRoleResponseDTO(
            guru_id=profile.guru_id,
            nip=profile.nip,
            nama_lengkap=profile.nama_lengkap,
            structural_role=profile.structural_role,
            user_type=profile.user.user_type if profile.user else UserType.guru,
        )


class UserManagementService:
    """
    Compatibility facade for routers.
    Internally delegates to student/teacher specific services.
    """

    def __init__(
        self,
        db: AsyncSession,
        repo: UserManagementRepository | None = None,
        policy: type[UserManagementPolicy] = UserManagementPolicy,
    ):
        self.repo = repo or UserManagementRepository(db)
        self.policy = policy
        self.students = StudentUserManagementService(self.repo, self.policy)
        self.teachers = TeacherUserManagementService(self.repo, self.policy)

    async def list_students(
        self, skip: int = 0, limit: int = 30, search: Optional[str] = None
    ) -> PaginatedStudentsResponse:
        return await self.students.list_students(skip=skip, limit=limit, search=search)

    async def get_student(self, siswa_id: UUID) -> StudentProfileResponseDTO:
        return await self.students.get_student(siswa_id)

    async def get_student_by_user_id(self, user_id: UUID) -> StudentProfileResponseDTO:
        return await self.students.get_student_by_user_id(user_id)

    async def update_student(
        self, siswa_id: UUID, request: UpdateStudentRequestDTO
    ) -> StudentProfileResponseDTO:
        return await self.students.update_student(siswa_id, request)

    async def delete_student(self, siswa_id: UUID) -> MessageResponseDTO:
        return await self.students.delete_student(siswa_id)

    async def list_gurus(
        self, skip: int = 0, limit: int = 30, search: Optional[str] = None
    ) -> PaginatedTeachersResponse:
        return await self.teachers.list_teachers(skip=skip, limit=limit, search=search)

    async def get_guru(self, guru_id: UUID) -> GuruProfileResponseDTO:
        return await self.teachers.get_teacher(guru_id)

    async def get_guru_by_user_id(self, user_id: UUID) -> GuruProfileResponseDTO:
        return await self.teachers.get_teacher_by_user_id(user_id)

    async def update_guru(
        self, guru_id: UUID, request: UpdateGuruRequestDTO
    ) -> GuruProfileResponseDTO:
        return await self.teachers.update_teacher(guru_id, request)

    async def delete_guru(self, guru_id: UUID) -> MessageResponseDTO:
        return await self.teachers.delete_teacher(guru_id)

    async def get_struktur_guru(self) -> GetStructuralRoleResponseListDTO:
        return await self.teachers.get_structural_roles()

    async def list_public_civitas(
        self, skip: int = 0, limit: int = 100, search: Optional[str] = None
    ) -> PaginatedPublicCivitasResponse:
        return await self.teachers.list_public_civitas(skip=skip, limit=limit, search=search)
