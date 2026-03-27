from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.akademik.guru_mapel_dto import (
    CreateGuruMapelDTO,
    GuruMapelResponseDTO,
    MessageResponseDTO,
    UpdateGuruMapelDTO,
)
from app.dto.akademik.jadwal_dto import (
    CreateJadwalDTO,
    JadwalResponseDTO,
    UpdateJadwalDTO,
)
from app.models.guru_mapel import GuruMapel
from app.models.jadwal import Jadwal
from app.models.user import User
from app.policy.jadwal_policy import JadwalPolicy
from app.policy.slot_waktu_policy import SlotWaktuPolicy
from app.repositoriy.jadwal_repository import JadwalRepository


class JadwalService:
    def __init__(
        self,
        db: AsyncSession,
        repo: JadwalRepository | None = None,
        policy: type[JadwalPolicy] = JadwalPolicy,
    ):
        self.repo = repo or JadwalRepository(db)
        self.policy = policy

    async def create_guru_mapel(self, request: CreateGuruMapelDTO) -> GuruMapelResponseDTO:
        user = await self.repo.find_user_by_id(request.user_id)
        self.policy.ensure_user_exists(user, request.user_id)
        self.policy.ensure_user_is_guru(user, request.user_id)

        mapel = await self.repo.find_mapel_by_id(request.mapel_id)
        self.policy.ensure_entity_exists(mapel, "Mata pelajaran", request.mapel_id)

        kelas = await self.repo.find_kelas_by_id(request.kelas_id)
        self.policy.ensure_entity_exists(kelas, "Kelas", request.kelas_id)

        tahun_ajaran = await self.repo.find_tahun_ajaran_by_id(request.tahun_ajaran_id)
        self.policy.ensure_entity_exists(tahun_ajaran, "Tahun ajaran", request.tahun_ajaran_id)

        existing = await self.repo.find_guru_mapel_unique(
            request.user_id, request.mapel_id, request.kelas_id, request.tahun_ajaran_id
        )
        self.policy.ensure_guru_mapel_unique(existing)

        guru_mapel = GuruMapel(
            user_id=request.user_id,
            mapel_id=request.mapel_id,
            kelas_id=request.kelas_id,
            tahun_ajaran_id=request.tahun_ajaran_id,
        )
        await self.repo.add_guru_mapel(guru_mapel)
        await self.repo.commit()

        guru_mapel = await self.repo.find_guru_mapel_by_id_with_relations(guru_mapel.guru_mapel_id)
        return self._to_guru_mapel_dto(guru_mapel)

    async def list_guru_mapel(self) -> list[GuruMapelResponseDTO]:
        guru_mapels = await self.repo.list_guru_mapel_all()
        return [self._to_guru_mapel_dto(gm) for gm in guru_mapels]

    async def list_guru_mapel_active_tahun(self) -> list[GuruMapelResponseDTO]:
        guru_mapels = await self.repo.list_guru_mapel_active_tahun()
        return [self._to_guru_mapel_dto(gm) for gm in guru_mapels]

    async def list_guru_mapel_by_guru(self, user_id: UUID) -> list[GuruMapelResponseDTO]:
        guru_mapels = await self.repo.list_guru_mapel_by_guru(user_id)
        return [self._to_guru_mapel_dto(gm) for gm in guru_mapels]

    async def list_guru_mapel_by_kelas(self, kelas_id: UUID) -> list[GuruMapelResponseDTO]:
        guru_mapels = await self.repo.list_guru_mapel_by_kelas(kelas_id)
        return [self._to_guru_mapel_dto(gm) for gm in guru_mapels]

    async def delete_guru_mapel(self, guru_mapel_id: UUID) -> MessageResponseDTO:
        guru_mapel = await self.repo.find_guru_mapel_by_id(guru_mapel_id)
        self.policy.ensure_guru_mapel_exists(guru_mapel, guru_mapel_id)
        await self.repo.delete_guru_mapel(guru_mapel)
        await self.repo.commit()
        return MessageResponseDTO(message="GuruMapel deleted successfully")

    async def update_guru_mapel(
        self, guru_mapel_id: UUID, request: UpdateGuruMapelDTO
    ) -> GuruMapelResponseDTO:
        guru_mapel = await self.repo.find_guru_mapel_by_id(guru_mapel_id)
        self.policy.ensure_guru_mapel_exists(guru_mapel, guru_mapel_id)
        old_user_id = guru_mapel.user_id
        old_mapel_id = guru_mapel.mapel_id
        old_kelas_id = guru_mapel.kelas_id

        update_data = request.model_dump(exclude_unset=True)
        self.policy.ensure_guru_mapel_update_payload(update_data)

        new_user_id = update_data.get("user_id", guru_mapel.user_id)
        new_mapel_id = update_data.get("mapel_id", guru_mapel.mapel_id)
        new_kelas_id = update_data.get("kelas_id", guru_mapel.kelas_id)

        if "user_id" in update_data:
            user = await self.repo.find_user_by_id(new_user_id)
            self.policy.ensure_user_exists(user, new_user_id)
            self.policy.ensure_user_is_guru(user, new_user_id)

        if "mapel_id" in update_data:
            mapel = await self.repo.find_mapel_by_id(new_mapel_id)
            self.policy.ensure_entity_exists(mapel, "Mata pelajaran", new_mapel_id)

        if "kelas_id" in update_data:
            kelas = await self.repo.find_kelas_by_id(new_kelas_id)
            self.policy.ensure_entity_exists(kelas, "Kelas", new_kelas_id)

        existing = await self.repo.find_guru_mapel_unique(
            new_user_id, new_mapel_id, new_kelas_id, guru_mapel.tahun_ajaran_id
        )
        if existing and existing.guru_mapel_id != guru_mapel_id:
            self.policy.ensure_guru_mapel_unique(existing)

        guru_mapel.user_id = new_user_id
        guru_mapel.mapel_id = new_mapel_id
        guru_mapel.kelas_id = new_kelas_id

        if old_user_id != new_user_id:
            await self.repo.sync_jadwal_teacher_for_assignment(
                tahun_ajaran_id=guru_mapel.tahun_ajaran_id,
                kelas_id=old_kelas_id,
                mapel_id=old_mapel_id,
                old_user_id=old_user_id,
                new_user_id=new_user_id,
            )

        await self.repo.commit()
        await self.repo.refresh_guru_mapel(guru_mapel)
        guru_mapel = await self.repo.find_guru_mapel_by_id_with_relations(guru_mapel.guru_mapel_id)
        return self._to_guru_mapel_dto(guru_mapel)

    async def create_jadwal(self, request: CreateJadwalDTO) -> JadwalResponseDTO:
        semester = await self.repo.find_semester_by_id(request.semester_id)
        self.policy.ensure_entity_exists(semester, "Semester", request.semester_id)

        kelas = await self.repo.find_kelas_by_id(request.kelas_id)
        self.policy.ensure_entity_exists(kelas, "Kelas", request.kelas_id)

        mapel = await self.repo.find_mapel_by_id(request.mapel_id)
        self.policy.ensure_entity_exists(mapel, "Mata pelajaran", request.mapel_id)

        guru = await self.repo.find_user_by_id(request.guru_user_id)
        self.policy.ensure_user_exists(guru, request.guru_user_id)
        self.policy.ensure_user_is_guru(guru, request.guru_user_id)

        slot_waktu = await self.repo.find_slot_waktu_by_id(request.slot_waktu_id)
        self.policy.ensure_entity_exists(slot_waktu, "Slot waktu", request.slot_waktu_id)
        SlotWaktuPolicy.ensure_time_range_valid(slot_waktu.jam_mulai, slot_waktu.jam_selesai)

        class_time_clash = await self.repo.find_class_time_overlap(
            request.semester_id,
            request.hari,
            request.kelas_id,
            slot_waktu.jam_mulai,
            slot_waktu.jam_selesai,
        )
        self.policy.ensure_class_time_available(class_time_clash)

        teacher_time_clash = await self.repo.find_teacher_time_overlap(
            request.semester_id,
            request.hari,
            request.guru_user_id,
            slot_waktu.jam_mulai,
            slot_waktu.jam_selesai,
        )
        self.policy.ensure_teacher_time_available(teacher_time_clash)

        jadwal = Jadwal(
            semester_id=request.semester_id,
            kelas_id=request.kelas_id,
            mapel_id=request.mapel_id,
            guru_user_id=request.guru_user_id,
            hari=request.hari,
            slot_waktu_id=request.slot_waktu_id,
        )
        await self.repo.add_jadwal(jadwal)
        await self.repo.commit()
        await self.repo.refresh(jadwal)
        return self._to_jadwal_dto(jadwal)

    async def list_jadwal_by_semester(self, semester_id: UUID) -> list[JadwalResponseDTO]:
        jadwals = await self.repo.list_jadwal_by_semester(semester_id)
        return [self._to_jadwal_dto(j) for j in jadwals]

    async def list_jadwal_by_kelas(self, kelas_id: UUID) -> list[JadwalResponseDTO]:
        jadwals = await self.repo.list_jadwal_by_kelas(kelas_id)
        return [self._to_jadwal_dto(j) for j in jadwals]

    async def list_jadwal_by_guru(self, user_id: UUID) -> list[JadwalResponseDTO]:
        jadwals = await self.repo.list_jadwal_by_guru(user_id)
        return [self._to_jadwal_dto(j) for j in jadwals]

    async def get_student_jadwal(self, user_id: UUID) -> list[JadwalResponseDTO]:
        kelas_id = await self.repo.find_student_kelas_id(user_id)
        self.policy.ensure_student_has_kelas(kelas_id)
        return await self.list_jadwal_by_kelas(kelas_id)

    async def update_jadwal(self, jadwal_id: UUID, request: UpdateJadwalDTO) -> JadwalResponseDTO:
        jadwal = await self.repo.find_jadwal_by_id(jadwal_id)
        self.policy.ensure_jadwal_exists(jadwal, jadwal_id)

        update_data = request.model_dump(exclude_unset=True)
        self.policy.ensure_update_payload(update_data)

        if "mapel_id" in update_data:
            mapel = await self.repo.find_mapel_by_id(update_data["mapel_id"])
            self.policy.ensure_entity_exists(mapel, "Mata pelajaran", update_data["mapel_id"])

        if "guru_user_id" in update_data:
            guru = await self.repo.find_user_by_id(update_data["guru_user_id"])
            self.policy.ensure_user_exists(guru, update_data["guru_user_id"])
            self.policy.ensure_user_is_guru(guru, update_data["guru_user_id"])

        if "slot_waktu_id" in update_data:
            slot_waktu = await self.repo.find_slot_waktu_by_id(update_data["slot_waktu_id"])
            self.policy.ensure_entity_exists(slot_waktu, "Slot waktu", update_data["slot_waktu_id"])
            SlotWaktuPolicy.ensure_time_range_valid(slot_waktu.jam_mulai, slot_waktu.jam_selesai)
        else:
            slot_waktu = await self.repo.find_slot_waktu_by_id(jadwal.slot_waktu_id)
            self.policy.ensure_entity_exists(slot_waktu, "Slot waktu", jadwal.slot_waktu_id)
            SlotWaktuPolicy.ensure_time_range_valid(slot_waktu.jam_mulai, slot_waktu.jam_selesai)

        new_hari = update_data.get("hari", jadwal.hari)
        new_guru_user_id = update_data.get("guru_user_id", jadwal.guru_user_id)

        class_time_clash = await self.repo.find_class_time_overlap(
            jadwal.semester_id,
            new_hari,
            jadwal.kelas_id,
            slot_waktu.jam_mulai,
            slot_waktu.jam_selesai,
            exclude_jadwal_id=jadwal_id,
        )
        self.policy.ensure_class_time_available(class_time_clash)

        teacher_time_clash = await self.repo.find_teacher_time_overlap(
            jadwal.semester_id,
            new_hari,
            new_guru_user_id,
            slot_waktu.jam_mulai,
            slot_waktu.jam_selesai,
            exclude_jadwal_id=jadwal_id,
        )
        self.policy.ensure_teacher_time_available(teacher_time_clash)

        for field, value in update_data.items():
            setattr(jadwal, field, value)

        await self.repo.commit()
        await self.repo.refresh(jadwal)
        return self._to_jadwal_dto(jadwal)

    async def delete_jadwal(self, jadwal_id: UUID) -> MessageResponseDTO:
        jadwal = await self.repo.find_jadwal_by_id(jadwal_id)
        self.policy.ensure_jadwal_exists(jadwal, jadwal_id)
        await self.repo.delete_jadwal(jadwal)
        await self.repo.commit()
        return MessageResponseDTO(message="Jadwal deleted successfully")

    def _to_guru_mapel_dto(self, guru_mapel: GuruMapel) -> GuruMapelResponseDTO:
        guru_nama = None
        if guru_mapel.user and guru_mapel.user.guru_profile:
            guru_nama = guru_mapel.user.guru_profile.nama_lengkap
        mapel_nama = guru_mapel.mapel.nama_mapel if guru_mapel.mapel else None
        kelas_nama = guru_mapel.kelas.nama_kelas if guru_mapel.kelas else None

        return GuruMapelResponseDTO(
            guru_mapel_id=guru_mapel.guru_mapel_id,
            user_id=guru_mapel.user_id,
            mapel_id=guru_mapel.mapel_id,
            kelas_id=guru_mapel.kelas_id,
            tahun_ajaran_id=guru_mapel.tahun_ajaran_id,
            guru_nama=guru_nama,
            mapel_nama=mapel_nama,
            kelas_nama=kelas_nama,
        )

    def _to_jadwal_dto(self, jadwal: Jadwal) -> JadwalResponseDTO:
        guru_nama = None
        if jadwal.guru and jadwal.guru.guru_profile:
            guru_nama = jadwal.guru.guru_profile.nama_lengkap
        return JadwalResponseDTO(
            jadwal_id=jadwal.jadwal_id,
            semester_id=jadwal.semester_id,
            kelas_id=jadwal.kelas_id,
            mapel_id=jadwal.mapel_id,
            guru_user_id=jadwal.guru_user_id,
            hari=jadwal.hari,
            slot_waktu_id=jadwal.slot_waktu_id,
            mapel_nama=jadwal.mapel.nama_mapel if jadwal.mapel else None,
            nama_kelas=jadwal.kelas.nama_kelas if jadwal.kelas else None,
            guru_nama=guru_nama,
            jam_mulai=jadwal.slot_waktu.jam_mulai if jadwal.slot_waktu else None,
            jam_selesai=jadwal.slot_waktu.jam_selesai if jadwal.slot_waktu else None,
        )
