from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.registration.registration_dto import (
    ClaimResponseDTO,
    ClaimStudentRequestDTO,
    ClaimTeacherRequestDTO,
    PreRegisterResponseDTO,
    PreRegisterStudentDTO,
    PreRegisterTeacherDTO,
    StudentLookupResponseDTO,
    TeacherLookupResponseDTO,
)
from app.enums import StatusGuru, StatusSiswa, UserType, RegistrationStatus
from app.models.guru_profile import GuruProfile
from app.models.siswa_profile import SiswaProfile
from app.policy.registration_policy import RegistrationPolicy
from app.repositoriy.registration_repository import RegistrationRepository


class RegistrationService:
    """
    Handles pre-registration and NIS/NIP-based claim flow.
    """

    def __init__(
        self,
        db: AsyncSession,
        repo: RegistrationRepository | None = None,
        policy: type[RegistrationPolicy] = RegistrationPolicy,
    ):
        self.repo = repo or RegistrationRepository(db)
        self.policy = policy

    async def lookup_student_by_nis(self, nis: str) -> StudentLookupResponseDTO:
        profile = await self.repo.get_student_profile_by_nis_with_user(nis)
        self.policy.ensure_student_profile_exists(profile)
        self.policy.ensure_pending_student(profile.user)

        return StudentLookupResponseDTO(
            siswa_id=profile.siswa_id,
            nis=profile.nis,
            nama_lengkap=profile.nama_lengkap,
            kelas_jurusan=profile.kelas_jurusan,
            jenis_kelamin=profile.jenis_kelamin,
        )

    async def lookup_teacher_by_nip(self, nip: str) -> TeacherLookupResponseDTO:
        profile = await self.repo.get_teacher_profile_by_nip_with_user(nip)
        self.policy.ensure_teacher_profile_exists(profile)
        self.policy.ensure_pending_teacher(profile.user)

        return TeacherLookupResponseDTO(
            guru_id=profile.guru_id,
            nip=profile.nip,
            nama_lengkap=profile.nama_lengkap,
            jenis_kelamin=profile.jenis_kelamin,
        )

    async def claim_student(self, request: ClaimStudentRequestDTO) -> ClaimResponseDTO:
        profile = await self.repo.get_student_profile_by_nis_with_user(request.nis)
        self.policy.ensure_student_profile_exists(profile)

        user = profile.user
        self.policy.ensure_pending_student(user)

        is_taken = await self.repo.is_username_taken(request.username)
        self.policy.ensure_username_available(is_taken, request.username)

        user.username = request.username
        user.set_password(request.password)
        user.registration_status = RegistrationStatus.completed
        user.is_active = True

        await self.repo.commit()

        return ClaimResponseDTO(
            message="Registrasi berhasil! Silakan login.",
            username=user.username,
            user_type=user.user_type.value,
        )

    async def claim_teacher(self, request: ClaimTeacherRequestDTO) -> ClaimResponseDTO:
        profile = await self.repo.get_teacher_profile_by_nip_with_user(request.nip)
        self.policy.ensure_teacher_profile_exists(profile)

        user = profile.user
        self.policy.ensure_pending_teacher(user)

        is_taken = await self.repo.is_username_taken(request.username)
        self.policy.ensure_username_available(is_taken, request.username)

        user.username = request.username
        user.set_password(request.password)
        user.registration_status = RegistrationStatus.completed
        user.is_active = True

        await self.repo.commit()

        return ClaimResponseDTO(
            message="Registrasi berhasil! Silakan login.",
            username=user.username,
            user_type=user.user_type.value,
        )

    async def pre_register_student(self, request: PreRegisterStudentDTO) -> PreRegisterResponseDTO:
        is_taken = await self.repo.is_nis_taken(request.nis)
        self.policy.ensure_nis_available(is_taken, request.nis)

        user = await self.repo.create_pending_user(UserType.siswa)
        profile_data = request.model_dump(exclude_unset=True)

        profile = SiswaProfile(
            user_id=user.user_id,
            nama_lengkap=request.nama_lengkap,
            nis=request.nis,
            status_siswa=StatusSiswa.aktif,
            kewarganegaraan=profile_data.get("kewarganegaraan", "Indonesia"),
        )
        self._set_student_optional_fields(profile, profile_data)

        await self.repo.add_student_profile(profile)
        await self.repo.commit()

        return PreRegisterResponseDTO(message=f"Siswa '{request.nama_lengkap}' berhasil didaftarkan (PENDING)")

    async def pre_register_teacher(self, request: PreRegisterTeacherDTO) -> PreRegisterResponseDTO:
        is_taken = await self.repo.is_nip_taken(request.nip)
        self.policy.ensure_nip_available(is_taken, request.nip)

        user = await self.repo.create_pending_user(UserType.guru)
        profile_data = request.model_dump(exclude_unset=True)

        profile = GuruProfile(
            user_id=user.user_id,
            nama_lengkap=request.nama_lengkap,
            nip=request.nip,
            status_guru=StatusGuru.aktif,
            kewarganegaraan=profile_data.get("kewarganegaraan", "Indonesia"),
        )
        self._set_teacher_optional_fields(profile, profile_data)

        await self.repo.add_teacher_profile(profile)
        await self.repo.commit()

        return PreRegisterResponseDTO(message=f"Guru '{request.nama_lengkap}' berhasil didaftarkan (PENDING)")

    @staticmethod
    def _set_student_optional_fields(profile: SiswaProfile, profile_data: dict) -> None:
        optional_fields = [
            "dob",
            "tempat_lahir",
            "jenis_kelamin",
            "alamat",
            "nama_wali",
            "tahun_masuk",
            "kontak",
        ]
        for field in optional_fields:
            if field in profile_data:
                setattr(profile, field, profile_data[field])

    @staticmethod
    def _set_teacher_optional_fields(profile: GuruProfile, profile_data: dict) -> None:
        optional_fields = [
            "dob",
            "tempat_lahir",
            "jenis_kelamin",
            "alamat",
            "nik",
            "tahun_masuk",
            "kontak",
            "bidang_wakasek",
            "mata_pelajaran",
            "pendidikan_terakhir",
        ]
        for field in optional_fields:
            if field in profile_data:
                setattr(profile, field, profile_data[field])
