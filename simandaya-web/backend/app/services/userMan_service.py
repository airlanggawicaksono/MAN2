from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.struktural.assignment_dto import (
    AssignStructuralRoleDTO,
    GuruStructuralAssignmentDTO,
    StructuralRoleRefDTO,
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
from app.models.guru_profile import GuruProfile
from app.models.guru_structural_assignment import GuruStructuralAssignment
from app.models.siswa_profile import SiswaProfile
from app.models.structural_role_ref import StructuralRoleRef
from app.enums import StructuralRole
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

        # Delete profile first to avoid ORM nulling FK on parent delete.
        await self.repo.delete_student_profile(profile)

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
        items: list[GuruProfileResponseDTO] = []
        for profile in profiles:
            items.append(await self._to_teacher_dto(profile))
        return PaginatedTeachersResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_teacher(self, guru_id: UUID) -> GuruProfileResponseDTO:
        profile = await self.repo.find_teacher_by_id_with_user(guru_id)
        self.policy.ensure_teacher_exists(profile, detail="Teacher not found")
        return await self._to_teacher_dto(profile)

    async def get_teacher_by_user_id(self, user_id: UUID) -> GuruProfileResponseDTO:
        profile = await self.repo.find_teacher_by_user_id_with_user(user_id)
        self.policy.ensure_teacher_exists(profile, detail="Teacher profile not found")
        return await self._to_teacher_dto(profile)

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
        return await self._to_teacher_dto(profile_with_user)

    async def delete_teacher(self, guru_id: UUID) -> MessageResponseDTO:
        profile = await self.repo.find_teacher_by_id(guru_id)
        self.policy.ensure_teacher_exists(profile, detail="Teacher not found")

        # Delete profile first to avoid ORM nulling FK on parent delete.
        await self.repo.delete_teacher_profile(profile)

        user = await self.repo.find_user_by_id(profile.user_id)
        if user:
            await self.repo.delete_user(user)

        await self.repo.commit()
        return MessageResponseDTO(message="Teacher deleted successfully")

    async def list_public_civitas(
        self, skip: int = 0, limit: int = 100, search: Optional[str] = None
    ) -> PaginatedPublicCivitasResponse:
        total = await self.repo.count_public_civitas(search=search)
        profiles = await self.repo.list_public_civitas(skip=skip, limit=limit, search=search)
        items: list[PublicCivitasResponseDTO] = []
        for p in profiles:
            assignments = await self.repo.list_teacher_structural_assignments(
                p.user_id, active_only=True
            )
            role_names = [
                a.role.name
                for a in assignments
                if a.role and a.role.code.lower() != "guru" and a.role.name.lower() != "guru"
            ]
            items.append(
                PublicCivitasResponseDTO(
                    nama=p.nama_lengkap,
                    nip=p.nip,
                    nik=p.nik,
                    jabatan_struktural=role_names,
                    matapelajaran=p.mata_pelajaran,
                    kontak=p.kontak,
                )
            )
        return PaginatedPublicCivitasResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
        )

    async def list_structural_role_catalog(
        self,
        include_inactive: bool = False,
        available_only: bool = False,
        for_user_id: UUID | None = None,
    ) -> list[StructuralRoleRefDTO]:
        roles = await self.repo.list_structural_role_refs(include_inactive=include_inactive)

        # Legacy cleanup: structural "Guru" should not appear in selectable structural positions.
        roles = [
            role
            for role in roles
            if role.code.lower() != "guru" and role.name.lower() != "guru"
        ]

        if available_only:
            active_assignments = await self.repo.list_active_structural_assignments()
            taken_role_ids = {
                assignment.role_id
                for assignment in active_assignments
                if assignment.user_id != for_user_id
            }

            roles = [
                role
                for role in roles
                if role.role_id not in taken_role_ids
            ]
        return [self._to_structural_role_ref_dto(r) for r in roles]

    async def assign_structural_role(
        self, request: AssignStructuralRoleDTO
    ) -> GuruStructuralAssignmentDTO:
        user = await self.repo.find_user_by_id(request.user_id)
        self.policy.ensure_user_exists(user, detail="User not found")
        self.policy.ensure_teacher_exists(
            await self.repo.find_teacher_by_user_id_with_user(request.user_id),
            detail="Target user is not a teacher",
        )

        role = await self.repo.find_structural_role_ref_by_code(request.structural_role.name)
        if not role:
            role = StructuralRoleRef(
                code=request.structural_role.name,
                name=request.structural_role.value,
                is_active=True,
            )
            await self.repo.add_structural_role_ref(role)
            await self.repo.commit()
            await self.repo.refresh(role)

        is_wali_kelas = role.code.lower() == "wali_kelas" or role.name.lower() == "wali kelas"
        self.policy.ensure_kelas_id_only_for_wali_kelas(is_wali_kelas, request.kelas_id)

        allow_multiple_holders = is_wali_kelas
        if not allow_multiple_holders:
            existing_active_assignment = await self.repo.find_active_structural_assignment_by_role_id(
                role.role_id
            )
            if existing_active_assignment and existing_active_assignment.user_id != request.user_id:
                self.policy.ensure_structural_role_not_taken(existing_active_assignment, role.name)

        assignment = GuruStructuralAssignment(
            user_id=request.user_id,
            role_id=role.role_id,
            tahun_ajaran_id=request.tahun_ajaran_id,
            start_date=request.start_date,
            end_date=request.end_date,
            is_active=request.is_active,
        )
        await self.repo.add_structural_assignment(assignment)

        if is_wali_kelas and request.kelas_id:
            kelas = await self.repo.find_kelas_by_id(request.kelas_id)
            self.policy.ensure_kelas_exists(kelas, detail="Kelas not found")
            self.policy.ensure_kelas_wali_not_taken(kelas, request.user_id)
            # One teacher should only own one wali-kelas class at a time.
            await self.repo.clear_wali_kelas_for_user(request.user_id)
            kelas.wali_kelas_id = request.user_id

        await self.repo.commit()
        await self.repo.refresh(assignment)

        assignment = await self.repo.find_teacher_structural_assignment_by_id(assignment.assignment_id)
        self.policy.ensure_assignment_exists(assignment)
        return self._to_structural_assignment_dto(assignment)

    async def list_teacher_structural_assignments(
        self, user_id: UUID, active_only: bool = False
    ) -> list[GuruStructuralAssignmentDTO]:
        assignments = await self.repo.list_teacher_structural_assignments(
            user_id=user_id, active_only=active_only
        )
        return [self._to_structural_assignment_dto(a) for a in assignments]

    async def deactivate_structural_assignment(self, assignment_id: UUID) -> MessageResponseDTO:
        assignment = await self.repo.find_teacher_structural_assignment_by_id(assignment_id)
        self.policy.ensure_assignment_exists(assignment)
        if assignment.role and (
            assignment.role.code.lower() == "wali_kelas"
            or assignment.role.name.lower() == "wali kelas"
        ):
            await self.repo.clear_wali_kelas_for_user(assignment.user_id)
        assignment.is_active = False
        await self.repo.commit()
        return MessageResponseDTO(message="Structural assignment deactivated")

    async def _to_teacher_dto(self, profile: GuruProfile) -> GuruProfileResponseDTO:
        assignments = await self.repo.list_teacher_structural_assignments(
            profile.user_id, active_only=False
        )
        assignments = [
            a
            for a in assignments
            if not a.role or (a.role.code.lower() != "guru" and a.role.name.lower() != "guru")
        ]
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
            structural_assignments=[self._to_structural_assignment_dto(a) for a in assignments],
            mata_pelajaran=profile.mata_pelajaran,
            pendidikan_terakhir=profile.pendidikan_terakhir,
            is_active=profile.user.is_active if profile.user else False,
        )

    @staticmethod
    def _to_structural_role_ref_dto(role: StructuralRoleRef) -> StructuralRoleRefDTO:
        return StructuralRoleRefDTO(
            role_id=role.role_id,
            code=role.code,
            name=role.name,
            is_active=role.is_active,
        )

    @staticmethod
    def _to_structural_assignment_dto(
        assignment: GuruStructuralAssignment,
    ) -> GuruStructuralAssignmentDTO:
        structural_role = None
        if assignment.role and assignment.role.code in StructuralRole.__members__:
            structural_role = StructuralRole[assignment.role.code]
        return GuruStructuralAssignmentDTO(
            assignment_id=assignment.assignment_id,
            user_id=assignment.user_id,
            role_id=assignment.role_id,
            structural_role=structural_role,
            role_code=assignment.role.code if assignment.role else None,
            role_name=assignment.role.name if assignment.role else None,
            tahun_ajaran_id=assignment.tahun_ajaran_id,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
            is_active=assignment.is_active,
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

    async def list_public_civitas(
        self, skip: int = 0, limit: int = 100, search: Optional[str] = None
    ) -> PaginatedPublicCivitasResponse:
        return await self.teachers.list_public_civitas(skip=skip, limit=limit, search=search)
