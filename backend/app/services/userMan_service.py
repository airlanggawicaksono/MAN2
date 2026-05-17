from __future__ import annotations

from typing import Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.struktural.assignment_dto import (
    AssignStructuralRoleDTO,
    GuruStructuralAssignmentDTO,
    StructuralRoleRefDTO,
)
from app.dto.userMan.userman_request import (
    CreateGuruRequestDTO,
    CreateStudentRequestDTO,
    UpdateGuruRequestDTO,
    UpdateStudentRequestDTO,
)
from app.dto.userMan.userman_response import (
    BulkImportGuruResultDTO,
    BulkImportGuruResultItem,
    BulkImportStudentResultDTO,
    BulkImportStudentResultItem,
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
from app.models.user import User
from app.enums import DeviceJobType, RegistrationStatus, StatusSiswa, StructuralRole, UserType
from app.policy.user_management_policy import UserManagementPolicy
from app.dto.desktop.desktop_response import CardSetResponseDTO
from app.pubsub.desktop_pubsub import publish_job_created, publish_student_deleted
from app.repositoriy.user_management_repository import UserManagementRepository
from app.services.desktop_service import DesktopService
from app.services.device_job_service import DeviceJobService

NON_ASSIGNABLE_STRUCTURAL_ROLE_CODES = {
    # Team-level positions are currently display-only in struktur organisasi.
    "tim_it",
    "pengembang_madrasah",
    "kepala_laboratorium_terpadu",
    "bimbingan_konseling",
    "satuan_pendidikan_ramah_anak",
    "tim_pendidikan_karakter",
    "tim_penjaminan_karakter",
    "pembina_ekstrakurikuler",
    "laboratorium_komputer",
    "publikasi_informasi",
    "multimedia_studio",
    "tim_adiwiyata",
    # Student-organization or extracurricular placeholders are display-only for now.
    "satgas_anti_narkoba",
    "pembina_osis",
    "pembina_mpk",
    "pembina_pikr",
    "pembina_kir",
    "pembina_robotik",
    "koordinator_osn_ksn",
    "koordinator_osn_ksm",
    "pembina_pmr_uks",
    "pembina_olahraga",
    "pembina_seni",
    "pembina_pecinta_alam",
    "pembina_corps_mubaligh",
    "pembina_pramuka",
    # Wali kelas should be handled by kelas assignment only.
    "wali_kelas",
    # General operational roles should stay informational in org chart (not structural assignments).
    "staf_tata_usaha",
    "pustakawan",
    "laboran",
    "petugas_uks",
}


class StudentUserManagementService:
    def __init__(
        self,
        repo: UserManagementRepository,
        policy: type[UserManagementPolicy],
        db: AsyncSession,
    ):
        self.repo = repo
        self.policy = policy
        self.db = db

    async def list_students(
        self,
        skip: int = 0,
        limit: int = 30,
        search: Optional[str] = None,
        status_siswa: Optional[StatusSiswa] = None,
    ) -> PaginatedStudentsResponse:
        total = await self.repo.count_students(search=search, status_siswa=status_siswa)
        profiles = await self.repo.list_students(skip=skip, limit=limit, search=search, status_siswa=status_siswa)
        items: list[StudentProfileResponseDTO] = []
        for profile in profiles:
            items.append(await self._to_student_dto(profile))
        return PaginatedStudentsResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_student(self, siswa_id: UUID) -> StudentProfileResponseDTO:
        profile = await self.repo.find_student_by_id_with_user(siswa_id)
        self.policy.ensure_student_exists(profile, detail="Student not found")
        return await self._to_student_dto(profile)

    async def get_student_by_user_id(self, user_id: UUID) -> StudentProfileResponseDTO:
        profile = await self.repo.find_student_by_user_id_with_user(user_id)
        self.policy.ensure_student_exists(profile, detail="Student profile not found")
        return await self._to_student_dto(profile)

    async def create_student(self, request: CreateStudentRequestDTO) -> StudentProfileResponseDTO:
        if request.nisn:
            existing = await self.repo.find_student_by_nisn(request.nisn)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"NISN '{request.nisn}' sudah terdaftar.",
                )

        # Strip rfid out of the profile payload — it goes through the
        # canonical set_student_card path AFTER the profile is committed,
        # so a hik.card.sync DeviceJob is enqueued and the card duplicate
        # check runs through the single owner.
        rfid_to_assign = request.rfid_number
        raw = request.model_dump()
        raw.pop("rfid_number", None)

        user = User(
            user_id=uuid4(),
            user_type=UserType.siswa,
            registration_status=RegistrationStatus.pending,
            is_active=True,
        )
        data = self._map_student_payload_keys(raw)
        profile = SiswaProfile(user_id=user.user_id, **data)
        await self.repo.add_user(user)
        await self.repo.add_student_profile(profile)
        await self.repo.commit()
        await self.repo.refresh(profile)

        if rfid_to_assign:
            await self._assign_card_after_create(profile.user_id, rfid_to_assign)

        profile_with_user = await self.repo.find_student_by_id_with_user(profile.siswa_id)
        self.policy.ensure_student_exists(profile_with_user, detail="Student not found after create")
        return await self._to_student_dto(profile_with_user)

    async def _assign_card_after_create(self, user_id: UUID, rfid: str) -> None:
        desktop = DesktopService(self.db)
        await desktop.set_student_card(user_id, rfid)

    async def _safe_assign_card(self, user_id: UUID, rfid: Optional[str]) -> Optional[str]:
        """
        Best-effort card assignment used during bulk import. Returns a warning
        string on failure so the row can be marked created-with-warning rather
        than rolling back the whole profile insert.
        """
        if not rfid:
            return None
        try:
            await self._assign_card_after_create(user_id, rfid)
            return None
        except HTTPException as e:
            return f"Card not assigned: {e.detail}"
        except Exception as e:
            return f"Card not assigned: {e}"

    async def set_card_by_siswa_id(
        self, siswa_id: UUID, new_rfid_number: str | None
    ) -> CardSetResponseDTO:
        profile = await self.repo.find_student_by_id(siswa_id)
        self.policy.ensure_student_exists(profile, detail="Student not found")
        desktop = DesktopService(self.db)
        return await desktop.set_student_card(profile.user_id, new_rfid_number)

    async def bulk_create_students(
        self, requests: list[CreateStudentRequestDTO]
    ) -> BulkImportStudentResultDTO:
        created = 0
        skipped = 0
        errors = 0
        items: list[BulkImportStudentResultItem] = []

        for i, req in enumerate(requests):
            row = i + 2
            try:
                if req.nisn:
                    existing = await self.repo.find_student_by_nisn(req.nisn)
                    if existing:
                        skipped += 1
                        items.append(BulkImportStudentResultItem(
                            row=row, nama_lengkap=req.nama_lengkap, nisn=req.nisn,
                            status="skipped", detail=f"NISN '{req.nisn}' sudah ada",
                        ))
                        continue
                rfid_to_assign = req.rfid_number
                raw = req.model_dump()
                raw.pop("rfid_number", None)

                user = User(
                    user_id=uuid4(),
                    user_type=UserType.siswa,
                    registration_status=RegistrationStatus.pending,
                    is_active=True,
                )
                data = self._map_student_payload_keys(raw)
                profile = SiswaProfile(user_id=user.user_id, **data)
                await self.repo.add_user(user)
                await self.repo.add_student_profile(profile)
                await self.repo.commit()

                # Card assignment is best-effort per row: a duplicate-card or
                # other error doesn't roll back the profile creation, just
                # gets reported on the same row's detail.
                card_warning = await self._safe_assign_card(profile.user_id, rfid_to_assign)
                created += 1
                items.append(BulkImportStudentResultItem(
                    row=row, nama_lengkap=req.nama_lengkap, nisn=req.nisn,
                    status="created", detail=card_warning,
                ))
            except Exception as e:
                await self.repo.rollback()
                errors += 1
                items.append(BulkImportStudentResultItem(
                    row=row, nama_lengkap=req.nama_lengkap, nisn=req.nisn,
                    status="error", detail=str(e),
                ))

        return BulkImportStudentResultDTO(created=created, skipped=skipped, errors=errors, items=items)

    async def update_student(
        self, siswa_id: UUID, request: UpdateStudentRequestDTO
    ) -> StudentProfileResponseDTO:
        profile = await self.repo.find_student_by_id(siswa_id)
        self.policy.ensure_student_exists(profile, detail="Student not found")

        update_data = request.model_dump(exclude_unset=True)
        # RFID card mutations must go through POST /api/desktop/students/{uid}/card
        # so that the BE write is paired with a hik.card.sync DeviceJob in the
        # same transaction. Block sneaky updates via the generic profile PATCH.
        if "rfid_number" in update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="rfid_number cannot be edited here. Use the dedicated card endpoint.",
            )
        self.policy.ensure_update_payload(update_data)

        if "nisn" in update_data and update_data["nisn"] != profile.nis:
            nisn_check = await self.repo.find_student_by_nisn(update_data["nisn"])
            self.policy.ensure_nisn_available(nisn_check is not None, update_data["nisn"])

        update_data = self._map_student_payload_keys(update_data)
        for field, value in update_data.items():
            setattr(profile, field, value)

        await self.repo.commit()
        await self.repo.refresh(profile)

        profile_with_user = await self.repo.find_student_by_id_with_user(siswa_id)
        self.policy.ensure_student_exists(profile_with_user, detail="Student not found")
        return await self._to_student_dto(profile_with_user)

    async def delete_student(self, siswa_id: UUID) -> MessageResponseDTO:
        profile = await self.repo.find_student_by_id(siswa_id)
        self.policy.ensure_student_exists(profile, detail="Student not found")

        # Snapshot what sijinak / Hikvision need before the row is gone.
        user_id = profile.user_id
        rfid_snapshot = profile.rfid_number

        # Delete profile first to avoid ORM nulling FK on parent delete.
        await self.repo.delete_student_profile(profile)

        user = await self.repo.find_user_by_id(user_id)
        if user:
            await self.repo.delete_user(user)

        # Outbox: ask sijinak's DeviceJob worker to delete the person + card
        # from Hikvision. Same transaction as the BE delete.
        job_service = DeviceJobService(self.db)
        job = await job_service.enqueue(
            job_type=DeviceJobType.hik_person_delete.value,
            payload={
                "user_id": str(user_id),
                "employee_no": user_id.hex,
                "rfid_number": rfid_snapshot,
            },
            related_user_id=user_id,
        )

        await self.repo.commit()

        # Pubsub: instant invalidation so sijinak drops local Drift row and
        # unpublished TapRecords without waiting for the next snapshot poll.
        publish_student_deleted(user_id, rfid_snapshot)
        publish_job_created(job.id, job.job_type)

        return MessageResponseDTO(message="Student deleted successfully")

    async def _to_student_dto(self, profile: SiswaProfile) -> StudentProfileResponseDTO:
        return StudentProfileResponseDTO(
            siswa_id=profile.siswa_id,
            user_id=profile.user_id,
            nisn=profile.nis,
            nama_lengkap=profile.nama_lengkap,
            dob=profile.dob,
            tempat_lahir=profile.tempat_lahir,
            jenis_kelamin=profile.jenis_kelamin,
            alamat=profile.alamat,
            nama_wali=profile.nama_wali,
            no_telephone_wali=profile.no_telephone_wali,
            kelas_jurusan=profile.kelas_jurusan,
            kelas_nama=profile.kelas_jurusan,
            tahun_masuk=profile.tahun_masuk,
            status_siswa=profile.status_siswa,
            semester_aktif_tipe=None,
            semester_ke=None,
            kontak=profile.kontak,
            kewarganegaraan=profile.kewarganegaraan,
            rfid_number=profile.rfid_number,
            is_active=profile.user.is_active if profile.user else False,
        )

    @staticmethod
    def _map_student_payload_keys(data: dict) -> dict:
        # Keep DB column/ORM attribute as `nis`, while API contract exposes `nisn`.
        if "nisn" in data:
            data["nis"] = data.pop("nisn")
        return data


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

    async def create_teacher(self, request: CreateGuruRequestDTO) -> GuruProfileResponseDTO:
        if request.nip:
            existing = await self.repo.find_teacher_by_nip(request.nip)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"NIP '{request.nip}' sudah terdaftar.",
                )
        user = User(
            user_id=uuid4(),
            user_type=UserType.guru,
            registration_status=RegistrationStatus.pending,
            is_active=True,
        )
        profile = GuruProfile(user_id=user.user_id, **request.model_dump())
        await self.repo.add_user(user)
        await self.repo.add_teacher_profile(profile)
        await self.repo.commit()
        await self.repo.refresh(profile)
        profile_with_user = await self.repo.find_teacher_by_id_with_user(profile.guru_id)
        self.policy.ensure_teacher_exists(profile_with_user, detail="Teacher not found after create")
        return await self._to_teacher_dto(profile_with_user)

    async def bulk_create_teachers(
        self, requests: list[CreateGuruRequestDTO]
    ) -> BulkImportGuruResultDTO:
        created = 0
        skipped = 0
        errors = 0
        items: list[BulkImportGuruResultItem] = []

        for i, req in enumerate(requests):
            row = i + 2
            try:
                if req.nip:
                    existing = await self.repo.find_teacher_by_nip(req.nip)
                    if existing:
                        skipped += 1
                        items.append(BulkImportGuruResultItem(
                            row=row, nama_lengkap=req.nama_lengkap, nip=req.nip,
                            status="skipped", detail=f"NIP '{req.nip}' sudah ada",
                        ))
                        continue
                user = User(
                    user_id=uuid4(),
                    user_type=UserType.guru,
                    registration_status=RegistrationStatus.pending,
                    is_active=True,
                )
                profile = GuruProfile(user_id=user.user_id, **req.model_dump())
                await self.repo.add_user(user)
                await self.repo.add_teacher_profile(profile)
                await self.repo.commit()
                created += 1
                items.append(BulkImportGuruResultItem(
                    row=row, nama_lengkap=req.nama_lengkap, nip=req.nip, status="created",
                ))
            except Exception as e:
                await self.repo.rollback()
                errors += 1
                items.append(BulkImportGuruResultItem(
                    row=row, nama_lengkap=req.nama_lengkap, nip=req.nip,
                    status="error", detail=str(e),
                ))

        return BulkImportGuruResultDTO(created=created, skipped=skipped, errors=errors, items=items)

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
            role_names_raw = [
                a.role.name
                for a in assignments
                if a.role
                and a.role.code.lower() not in {"guru", "wali_kelas"}
                and a.role.name.lower() not in {"guru", "wali kelas"}
            ]
            # Keep order stable while removing duplicates from legacy/duplicate assignments.
            role_names = list(dict.fromkeys(role_names_raw))
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
        # Enum is the source of truth for assignable roles — no DB seed needed.
        assignable = [
            member
            for member in StructuralRole
            if member.name.lower() not in NON_ASSIGNABLE_STRUCTURAL_ROLE_CODES
            and member.name.lower() not in {"guru", "wali_kelas"}
        ]

        # Map DB rows by code so we can look up role_ids for availability.
        db_roles = await self.repo.list_structural_role_refs(include_inactive=include_inactive)
        db_by_code: dict[str, StructuralRoleRef] = {
            role.code.lower(): role for role in db_roles
        }

        if available_only:
            active_assignments = await self.repo.list_active_structural_assignments()
            taken_role_ids = {
                assignment.role_id
                for assignment in active_assignments
                if assignment.user_id != for_user_id
            }
        else:
            taken_role_ids = set()

        result: list[StructuralRoleRefDTO] = []
        for member in assignable:
            db_role = db_by_code.get(member.name.lower())
            if available_only and db_role and db_role.role_id in taken_role_ids:
                continue
            result.append(
                StructuralRoleRefDTO(
                    role_id=str(db_role.role_id) if db_role else None,
                    code=member.name,
                    name=member.value,
                    is_active=db_role.is_active if db_role else True,
                )
            )
        return result

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
        if is_wali_kelas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Jabatan struktural 'Wali Kelas' dinonaktifkan. Atur wali kelas langsung dari menu Kelas.",
            )
        if role.code.lower() in NON_ASSIGNABLE_STRUCTURAL_ROLE_CODES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Jabatan ini saat ini hanya untuk bagan struktur organisasi "
                    "dan belum bisa di-assign ke guru."
                ),
            )
        self.policy.ensure_kelas_id_only_for_wali_kelas(False, request.kelas_id)

        allow_multiple_holders = False
        existing_active_assignment = await self.repo.find_active_structural_assignment_by_role_id(
            role.role_id
        )
        if not allow_multiple_holders and existing_active_assignment:
            if existing_active_assignment.user_id != request.user_id:
                self.policy.ensure_structural_role_not_taken(existing_active_assignment, role.name)
            else:
                # Idempotent behavior: same user + same active role should not create duplicate rows.
                assignment = await self.repo.find_teacher_structural_assignment_by_id(
                    existing_active_assignment.assignment_id
                )
                self.policy.ensure_assignment_exists(assignment)
                return self._to_structural_assignment_dto(assignment)

        # Enforce single active structural role per teacher:
        # assigning a new role automatically deactivates existing active roles.
        current_active_assignments = await self.repo.list_teacher_structural_assignments(
            user_id=request.user_id, active_only=True
        )
        for active_assignment in current_active_assignments:
            active_assignment.is_active = False

        assignment = GuruStructuralAssignment(
            user_id=request.user_id,
            role_id=role.role_id,
            tahun_ajaran_id=request.tahun_ajaran_id,
            start_date=request.start_date,
            end_date=request.end_date,
            is_active=request.is_active,
        )
        await self.repo.add_structural_assignment(assignment)

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
            if not a.role
            or (
                a.role.code.lower() not in {"guru", "wali_kelas"}
                and a.role.name.lower() not in {"guru", "wali kelas"}
            )
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
        self.students = StudentUserManagementService(self.repo, self.policy, db)
        self.teachers = TeacherUserManagementService(self.repo, self.policy)

    async def list_students(
        self,
        skip: int = 0,
        limit: int = 30,
        search: Optional[str] = None,
        status_siswa: Optional[StatusSiswa] = None,
    ) -> PaginatedStudentsResponse:
        return await self.students.list_students(skip=skip, limit=limit, search=search, status_siswa=status_siswa)

    async def get_student(self, siswa_id: UUID) -> StudentProfileResponseDTO:
        return await self.students.get_student(siswa_id)

    async def get_student_by_user_id(self, user_id: UUID) -> StudentProfileResponseDTO:
        return await self.students.get_student_by_user_id(user_id)

    async def create_student(self, request: CreateStudentRequestDTO) -> StudentProfileResponseDTO:
        return await self.students.create_student(request)

    async def bulk_create_students(
        self, requests: list[CreateStudentRequestDTO]
    ) -> BulkImportStudentResultDTO:
        return await self.students.bulk_create_students(requests)

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
