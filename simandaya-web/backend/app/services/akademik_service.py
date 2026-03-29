from uuid import UUID
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tahun_ajaran import TahunAjaran
from app.models.semester import Semester
from app.models.kalender_akademik import KalenderAkademik
from app.models.mata_pelajaran import MataPelajaran
from app.models.slot_waktu import SlotWaktu
from app.models.jadwal import Jadwal
from app.models.rapor_bobot import RaporBobot
from app.models.kelas import Kelas
from app.models.guru_mapel import GuruMapel
from app.models.kurikulum_mapel import KurikulumMapel
from app.models.user import User
from app.enums import TipeSemester, TingkatKelas
from app.policy.kalender_policy import KalenderPolicy
from app.policy.mapel_policy import MapelPolicy
from app.policy.semester_policy import SemesterPolicy
from app.policy.slot_waktu_policy import SlotWaktuPolicy
from app.policy.tahun_ajaran_policy import TahunAjaranPolicy
from app.repositoriy.kalender_repository import KalenderRepository
from app.repositoriy.mapel_repository import MapelRepository
from app.repositoriy.semester_repository import SemesterRepository
from app.repositoriy.slot_waktu_repository import SlotWaktuRepository
from app.repositoriy.student_semester_repository import StudentSemesterRepository
from app.repositoriy.tahun_ajaran_repository import TahunAjaranRepository
from app.dto.akademik.tahun_ajaran_dto import (
    CopyTahunAjaranStructureDTO,
    CopyTahunAjaranStructureResponseDTO,
    CreateTahunAjaranDTO,
    TahunAjaranResponseDTO,
    UpdateTahunAjaranDTO,
)
from app.dto.akademik.semester_dto import (
    CopySemesterStructureDTO,
    CopySemesterStructureResponseDTO,
    CreateSemesterDTO,
    SemesterResponseDTO,
    StudentSemesterTimelineItemDTO,
    UpdateSemesterDTO,
)
from app.dto.akademik.kalender_dto import (
    CreateKalenderDTO, UpdateKalenderDTO, KalenderResponseDTO
)
from app.dto.akademik.mapel_dto import (
    CreateMapelDTO, UpdateMapelDTO, MapelResponseDTO
)
from app.dto.akademik.slot_waktu_dto import (
    CreateSlotWaktuDTO, UpdateSlotWaktuDTO, SlotWaktuResponseDTO
)
from app.dto.akademik.kelas_dto import MessageResponseDTO


class AkademikService:
    """
    Academic service for CRUD on TahunAjaran, Semester, KalenderAkademik, MataPelajaran, SlotWaktu.

    Raises:
        HTTPException: 400, 404, 500
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.kalender_repo = KalenderRepository(db)
        self.kalender_policy = KalenderPolicy
        self.mapel_repo = MapelRepository(db)
        self.mapel_policy = MapelPolicy
        self.semester_repo = SemesterRepository(db)
        self.student_semester_repo = StudentSemesterRepository(db)
        self.semester_policy = SemesterPolicy
        self.slot_waktu_repo = SlotWaktuRepository(db)
        self.slot_waktu_policy = SlotWaktuPolicy
        self.tahun_ajaran_repo = TahunAjaranRepository(db)
        self.tahun_ajaran_policy = TahunAjaranPolicy

    # ── TahunAjaran CRUD ─────────────────────────────────────────────────────

    async def create_tahun_ajaran(self, request: CreateTahunAjaranDTO) -> TahunAjaranResponseDTO:
        """
        Create a new academic year.

        Raises:
            HTTPException: 400 if nama already exists
            HTTPException: 500 if database error
        """
        try:
            self.tahun_ajaran_policy.ensure_date_range_valid(
                request.tanggal_mulai, request.tanggal_selesai
            )
            existing = await self.tahun_ajaran_repo.find_by_nama(request.nama)
            self.tahun_ajaran_policy.ensure_nama_available(
                is_taken=existing is not None,
                nama=request.nama,
            )
            all_tahun_ajaran = await self.tahun_ajaran_repo.list_all()
            self.tahun_ajaran_policy.ensure_not_overlapping(
                all_tahun_ajaran, request.tanggal_mulai, request.tanggal_selesai
            )

            tahun_ajaran = TahunAjaran(
                nama=request.nama,
                tanggal_mulai=request.tanggal_mulai,
                tanggal_selesai=request.tanggal_selesai,
                is_active=request.is_active,
            )
            await self.tahun_ajaran_repo.add(tahun_ajaran)
            await self.tahun_ajaran_repo.commit()
            await self.tahun_ajaran_repo.refresh(tahun_ajaran)

            return self._to_tahun_ajaran_dto(tahun_ajaran)

        except HTTPException:
            raise
        except Exception as e:
            await self.tahun_ajaran_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create academic year: {str(e)}"
            )

    async def list_tahun_ajaran(self) -> list[TahunAjaranResponseDTO]:
        """
        List all academic years.

        Raises:
            HTTPException: 500 if database error
        """
        tahun_ajaran_list = await self.tahun_ajaran_repo.list_all()
        return [self._to_tahun_ajaran_dto(ta) for ta in tahun_ajaran_list]

    async def get_active_tahun_ajaran(self) -> TahunAjaranResponseDTO:
        tahun_ajaran = await self.tahun_ajaran_repo.find_active()
        if not tahun_ajaran:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active academic year found",
            )
        return self._to_tahun_ajaran_dto(tahun_ajaran)

    async def get_tahun_ajaran(self, tahun_ajaran_id: UUID) -> TahunAjaranResponseDTO:
        """
        Get a single academic year by ID.

        Raises:
            HTTPException: 404 if academic year not found
        """
        tahun_ajaran = await self.tahun_ajaran_repo.find_by_id(tahun_ajaran_id)
        self.tahun_ajaran_policy.ensure_exists(tahun_ajaran)
        return self._to_tahun_ajaran_dto(tahun_ajaran)

    async def update_tahun_ajaran(
        self, tahun_ajaran_id: UUID, request: UpdateTahunAjaranDTO
    ) -> TahunAjaranResponseDTO:
        """
        Partial update an academic year.

        Raises:
            HTTPException: 404 if academic year not found
            HTTPException: 400 if nama conflict or no fields to update
            HTTPException: 500 if database error
        """
        tahun_ajaran = await self.tahun_ajaran_repo.find_by_id(tahun_ajaran_id)
        self.tahun_ajaran_policy.ensure_exists(tahun_ajaran)

        update_data = request.model_dump(exclude_unset=True)
        self.tahun_ajaran_policy.ensure_update_payload(update_data)

        # Check nama uniqueness if being changed
        if "nama" in update_data and update_data["nama"] != tahun_ajaran.nama:
            nama_check = await self.tahun_ajaran_repo.find_by_nama(update_data["nama"])
            self.tahun_ajaran_policy.ensure_nama_available(
                is_taken=nama_check is not None,
                nama=update_data["nama"],
            )

        new_tanggal_mulai = update_data.get("tanggal_mulai", tahun_ajaran.tanggal_mulai)
        new_tanggal_selesai = update_data.get("tanggal_selesai", tahun_ajaran.tanggal_selesai)
        self.tahun_ajaran_policy.ensure_date_range_valid(new_tanggal_mulai, new_tanggal_selesai)

        all_tahun_ajaran = await self.tahun_ajaran_repo.list_all()
        self.tahun_ajaran_policy.ensure_not_overlapping(
            all_tahun_ajaran,
            new_tanggal_mulai,
            new_tanggal_selesai,
            exclude_id=tahun_ajaran_id,
        )

        for field, value in update_data.items():
            setattr(tahun_ajaran, field, value)

        await self.tahun_ajaran_repo.commit()
        await self.tahun_ajaran_repo.refresh(tahun_ajaran)
        return self._to_tahun_ajaran_dto(tahun_ajaran)

    async def delete_tahun_ajaran(self, tahun_ajaran_id: UUID) -> MessageResponseDTO:
        """
        Delete an academic year.

        Raises:
            HTTPException: 404 if academic year not found
            HTTPException: 500 if database error
        """
        tahun_ajaran = await self.tahun_ajaran_repo.find_by_id(tahun_ajaran_id)
        self.tahun_ajaran_policy.ensure_exists(tahun_ajaran)

        await self.tahun_ajaran_repo.delete(tahun_ajaran)
        await self.tahun_ajaran_repo.commit()
        return MessageResponseDTO(message="Academic year deleted successfully")

    # ── Semester CRUD ────────────────────────────────────────────────────────

    async def create_semester(self, request: CreateSemesterDTO) -> SemesterResponseDTO:
        """
        Create a new semester.

        Raises:
            HTTPException: 400 if tahun_ajaran_id doesn't exist or unique constraint violation
            HTTPException: 500 if database error
        """
        try:
            tahun_ajaran = await self.semester_repo.find_tahun_ajaran_by_id(
                request.tahun_ajaran_id
            )
            self.semester_policy.ensure_tahun_ajaran_exists(
                tahun_ajaran, request.tahun_ajaran_id
            )
            self.semester_policy.ensure_date_range_valid(
                request.tanggal_mulai, request.tanggal_selesai
            )
            self.semester_policy.ensure_within_tahun_ajaran(
                tahun_ajaran, request.tanggal_mulai, request.tanggal_selesai
            )

            semester_check = await self.semester_repo.find_by_tahun_ajaran_and_tipe(
                request.tahun_ajaran_id, request.tipe
            )
            self.semester_policy.ensure_unique_for_tahun_ajaran(
                semester_check, request.tipe
            )

            all_semesters = await self.semester_repo.list_by_tahun_ajaran(request.tahun_ajaran_id)
            self.semester_policy.ensure_not_overlapping(
                all_semesters, request.tanggal_mulai, request.tanggal_selesai
            )

            semester = Semester(
                tahun_ajaran_id=request.tahun_ajaran_id,
                tipe=request.tipe,
                tanggal_mulai=request.tanggal_mulai,
                tanggal_selesai=request.tanggal_selesai,
                is_active=request.is_active,
            )
            await self.semester_repo.add(semester)
            await self.semester_repo.commit()
            await self.semester_repo.refresh(semester)

            return self._to_semester_dto(semester)

        except HTTPException:
            raise
        except Exception as e:
            await self.semester_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create semester: {str(e)}"
            )

    async def list_semesters(self) -> list[SemesterResponseDTO]:
        """
        List all semesters.

        Raises:
            HTTPException: 500 if database error
        """
        semesters = await self.semester_repo.list_all()
        return [self._to_semester_dto(s) for s in semesters]

    async def list_active_semesters(self) -> list[SemesterResponseDTO]:
        semesters = await self.semester_repo.list_active()
        return [self._to_semester_dto(s) for s in semesters]

    async def list_my_semester_timeline(
        self, current_user: User
    ) -> list[StudentSemesterTimelineItemDTO]:
        expected_slots = [
            (1, TingkatKelas.x, TipeSemester.ganjil),
            (2, TingkatKelas.x, TipeSemester.genap),
            (3, TingkatKelas.xi, TipeSemester.ganjil),
            (4, TingkatKelas.xi, TipeSemester.genap),
            (5, TingkatKelas.xii, TipeSemester.ganjil),
            (6, TingkatKelas.xii, TipeSemester.genap),
        ]
        latest_by_slot: dict[
            tuple[TingkatKelas, TipeSemester],
            StudentSemesterTimelineItemDTO,
        ] = {}

        rows = await self.student_semester_repo.list_student_semester_rows(current_user.user_id)
        for (
            tingkat,
            tipe,
            semester_id,
            tahun_ajaran_id,
            tahun_ajaran_nama,
            kelas_id,
            kelas_nama,
            _tahun_mulai,
        ) in rows:
            if tingkat is None or tipe is None:
                continue
            slot_key = (tingkat, tipe)
            if slot_key in latest_by_slot:
                continue
            semester_ke = next(
                (
                    slot_no
                    for slot_no, slot_tingkat, slot_tipe in expected_slots
                    if slot_tingkat == tingkat and slot_tipe == tipe
                ),
                None,
            )
            if semester_ke is None:
                continue
            latest_by_slot[slot_key] = StudentSemesterTimelineItemDTO(
                semester_ke=semester_ke,
                tingkat=tingkat,
                tipe=tipe,
                semester_id=semester_id,
                tahun_ajaran_id=tahun_ajaran_id,
                tahun_ajaran_nama=tahun_ajaran_nama,
                kelas_id=kelas_id,
                kelas_nama=kelas_nama,
                is_available=True,
            )

        output: list[StudentSemesterTimelineItemDTO] = []
        for slot_no, tingkat, tipe in expected_slots:
            filled = latest_by_slot.get((tingkat, tipe))
            if filled:
                output.append(filled)
            else:
                output.append(
                    StudentSemesterTimelineItemDTO(
                        semester_ke=slot_no,
                        tingkat=tingkat,
                        tipe=tipe,
                        semester_id=None,
                        tahun_ajaran_id=None,
                        tahun_ajaran_nama=None,
                        kelas_id=None,
                        kelas_nama=None,
                        is_available=False,
                    )
                )
        return output

    async def get_semester(self, semester_id: UUID) -> SemesterResponseDTO:
        """
        Get a single semester by ID.

        Raises:
            HTTPException: 404 if semester not found
        """
        semester = await self.semester_repo.find_by_id(semester_id)
        self.semester_policy.ensure_exists(semester)
        return self._to_semester_dto(semester)

    async def list_semesters_by_tahun_ajaran(self, tahun_ajaran_id: UUID) -> list[SemesterResponseDTO]:
        """
        List all semesters for a specific academic year.

        Raises:
            HTTPException: 500 if database error
        """
        semesters = await self.semester_repo.list_by_tahun_ajaran(tahun_ajaran_id)
        return [self._to_semester_dto(s) for s in semesters]

    async def update_semester(
        self, semester_id: UUID, request: UpdateSemesterDTO
    ) -> SemesterResponseDTO:
        """
        Partial update a semester.

        Raises:
            HTTPException: 404 if semester not found
            HTTPException: 400 if no fields to update
            HTTPException: 500 if database error
        """
        semester = await self.semester_repo.find_by_id(semester_id)
        self.semester_policy.ensure_exists(semester)

        update_data = request.model_dump(exclude_unset=True)
        self.semester_policy.ensure_update_payload(update_data)

        tahun_ajaran = await self.semester_repo.find_tahun_ajaran_by_id(semester.tahun_ajaran_id)
        self.semester_policy.ensure_tahun_ajaran_exists(tahun_ajaran, semester.tahun_ajaran_id)

        new_tanggal_mulai = update_data.get("tanggal_mulai", semester.tanggal_mulai)
        new_tanggal_selesai = update_data.get("tanggal_selesai", semester.tanggal_selesai)
        self.semester_policy.ensure_date_range_valid(new_tanggal_mulai, new_tanggal_selesai)
        self.semester_policy.ensure_within_tahun_ajaran(
            tahun_ajaran, new_tanggal_mulai, new_tanggal_selesai
        )

        all_semesters = await self.semester_repo.list_by_tahun_ajaran(semester.tahun_ajaran_id)
        self.semester_policy.ensure_not_overlapping(
            all_semesters,
            new_tanggal_mulai,
            new_tanggal_selesai,
            exclude_id=semester_id,
        )

        for field, value in update_data.items():
            setattr(semester, field, value)

        await self.semester_repo.commit()
        await self.semester_repo.refresh(semester)
        return self._to_semester_dto(semester)

    async def delete_semester(self, semester_id: UUID) -> MessageResponseDTO:
        """
        Delete a semester.

        Raises:
            HTTPException: 404 if semester not found
            HTTPException: 500 if database error
        """
        semester = await self.semester_repo.find_by_id(semester_id)
        self.semester_policy.ensure_exists(semester)

        await self.semester_repo.delete(semester)
        await self.semester_repo.commit()
        return MessageResponseDTO(message="Semester deleted successfully")

    # ── KalenderAkademik CRUD ────────────────────────────────────────────────

    async def create_kalender(self, request: CreateKalenderDTO) -> KalenderResponseDTO:
        """
        Create a new academic calendar entry.

        Raises:
            HTTPException: 400 if tahun_ajaran_id doesn't exist
            HTTPException: 500 if database error
        """
        try:
            tahun_ajaran = await self.kalender_repo.find_tahun_ajaran_by_id(
                request.tahun_ajaran_id
            )
            self.kalender_policy.ensure_tahun_ajaran_exists(
                tahun_ajaran, request.tahun_ajaran_id
            )

            kalender = KalenderAkademik(
                tahun_ajaran_id=request.tahun_ajaran_id,
                tanggal=request.tanggal,
                jenis=request.jenis,
                keterangan=request.keterangan,
            )
            await self.kalender_repo.add(kalender)
            await self.kalender_repo.commit()
            await self.kalender_repo.refresh(kalender)

            return self._to_kalender_dto(kalender)

        except HTTPException:
            raise
        except Exception as e:
            await self.kalender_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create calendar entry: {str(e)}"
            )

    async def list_kalender(self) -> list[KalenderResponseDTO]:
        """
        List all academic calendar entries.

        Raises:
            HTTPException: 500 if database error
        """
        kalender_list = await self.kalender_repo.list_all()
        return [self._to_kalender_dto(k) for k in kalender_list]

    async def list_kalender_by_tahun_ajaran(self, tahun_ajaran_id: UUID) -> list[KalenderResponseDTO]:
        """
        List all calendar entries for a specific academic year.

        Raises:
            HTTPException: 500 if database error
        """
        kalender_list = await self.kalender_repo.list_by_tahun_ajaran(tahun_ajaran_id)
        return [self._to_kalender_dto(k) for k in kalender_list]

    async def update_kalender(
        self, kalender_id: UUID, request: UpdateKalenderDTO
    ) -> KalenderResponseDTO:
        """
        Partial update a calendar entry.

        Raises:
            HTTPException: 404 if calendar entry not found
            HTTPException: 400 if no fields to update
            HTTPException: 500 if database error
        """
        kalender = await self.kalender_repo.find_by_id(kalender_id)
        self.kalender_policy.ensure_exists(kalender)

        update_data = request.model_dump(exclude_unset=True)
        self.kalender_policy.ensure_update_payload(update_data)

        for field, value in update_data.items():
            setattr(kalender, field, value)

        await self.kalender_repo.commit()
        await self.kalender_repo.refresh(kalender)
        return self._to_kalender_dto(kalender)

    async def delete_kalender(self, kalender_id: UUID) -> MessageResponseDTO:
        """
        Delete a calendar entry.

        Raises:
            HTTPException: 404 if calendar entry not found
            HTTPException: 500 if database error
        """
        kalender = await self.kalender_repo.find_by_id(kalender_id)
        self.kalender_policy.ensure_exists(kalender)

        await self.kalender_repo.delete(kalender)
        await self.kalender_repo.commit()
        return MessageResponseDTO(message="Calendar entry deleted successfully")

    # ── MataPelajaran CRUD ───────────────────────────────────────────────────

    async def create_mapel(self, request: CreateMapelDTO) -> MapelResponseDTO:
        """
        Create a new subject (mata pelajaran).

        Raises:
            HTTPException: 400 if kode_mapel already exists
            HTTPException: 500 if database error
        """
        try:
            existing = await self.mapel_repo.find_by_kode(request.kode_mapel)
            self.mapel_policy.ensure_kode_available(
                is_taken=existing is not None,
                kode_mapel=request.kode_mapel,
            )

            mapel = MataPelajaran(
                kode_mapel=request.kode_mapel,
                nama_mapel=request.nama_mapel,
                kelompok=request.kelompok,
                is_active=request.is_active,
            )
            await self.mapel_repo.add(mapel)
            await self.mapel_repo.commit()
            await self.mapel_repo.refresh(mapel)

            return self._to_mapel_dto(mapel)

        except HTTPException:
            raise
        except Exception as e:
            await self.mapel_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create subject: {str(e)}"
            )

    async def list_mapel(self) -> list[MapelResponseDTO]:
        """
        List all subjects.

        Raises:
            HTTPException: 500 if database error
        """
        mapel_list = await self.mapel_repo.list_all()
        return [self._to_mapel_dto(m) for m in mapel_list]

    async def get_mapel(self, mapel_id: UUID) -> MapelResponseDTO:
        """
        Get a single subject by ID.

        Raises:
            HTTPException: 404 if subject not found
        """
        mapel = await self.mapel_repo.find_by_id(mapel_id)
        self.mapel_policy.ensure_exists(mapel)
        return self._to_mapel_dto(mapel)

    async def update_mapel(
        self, mapel_id: UUID, request: UpdateMapelDTO
    ) -> MapelResponseDTO:
        """
        Partial update a subject.

        Raises:
            HTTPException: 404 if subject not found
            HTTPException: 400 if kode_mapel conflict or no fields to update
            HTTPException: 500 if database error
        """
        mapel = await self.mapel_repo.find_by_id(mapel_id)
        self.mapel_policy.ensure_exists(mapel)

        update_data = request.model_dump(exclude_unset=True)
        self.mapel_policy.ensure_update_payload(update_data)

        # Check kode_mapel uniqueness if being changed
        if "kode_mapel" in update_data and update_data["kode_mapel"] != mapel.kode_mapel:
            kode_check = await self.mapel_repo.find_by_kode(update_data["kode_mapel"])
            self.mapel_policy.ensure_kode_available(
                is_taken=kode_check is not None,
                kode_mapel=update_data["kode_mapel"],
            )

        for field, value in update_data.items():
            setattr(mapel, field, value)

        await self.mapel_repo.commit()
        await self.mapel_repo.refresh(mapel)
        return self._to_mapel_dto(mapel)

    async def delete_mapel(self, mapel_id: UUID) -> MessageResponseDTO:
        """
        Delete a subject.

        Raises:
            HTTPException: 404 if subject not found
            HTTPException: 500 if database error
        """
        mapel = await self.mapel_repo.find_by_id(mapel_id)
        self.mapel_policy.ensure_exists(mapel)

        await self.mapel_repo.delete(mapel)
        await self.mapel_repo.commit()
        return MessageResponseDTO(message="Subject deleted successfully")

    # ── SlotWaktu CRUD ───────────────────────────────────────────────────────

    async def create_slot_waktu(self, request: CreateSlotWaktuDTO) -> SlotWaktuResponseDTO:
        """
        Create a new time slot.

        Raises:
            HTTPException: 500 if database error
        """
        try:
            self.slot_waktu_policy.ensure_time_range_valid(request.jam_mulai, request.jam_selesai)
            slot = SlotWaktu(
                nama=request.nama,
                jam_mulai=request.jam_mulai,
                jam_selesai=request.jam_selesai,
                urutan=request.urutan,
                is_piket=request.is_piket,
            )
            await self.slot_waktu_repo.add(slot)
            await self.slot_waktu_repo.commit()
            await self.slot_waktu_repo.refresh(slot)

            return self._to_slot_waktu_dto(slot)

        except Exception as e:
            await self.slot_waktu_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create time slot: {str(e)}"
            )

    async def list_slot_waktu(self) -> list[SlotWaktuResponseDTO]:
        """
        List all time slots, ordered by urutan.

        Raises:
            HTTPException: 500 if database error
        """
        slots = await self.slot_waktu_repo.list_all_ordered()
        return [self._to_slot_waktu_dto(s) for s in slots]

    async def update_slot_waktu(
        self, slot_id: UUID, request: UpdateSlotWaktuDTO
    ) -> SlotWaktuResponseDTO:
        """
        Partial update a time slot.

        Raises:
            HTTPException: 404 if time slot not found
            HTTPException: 400 if no fields to update
            HTTPException: 500 if database error
        """
        slot = await self.slot_waktu_repo.find_by_id(slot_id)
        self.slot_waktu_policy.ensure_exists(slot)

        update_data = request.model_dump(exclude_unset=True)
        self.slot_waktu_policy.ensure_update_payload(update_data)
        new_jam_mulai = update_data.get("jam_mulai", slot.jam_mulai)
        new_jam_selesai = update_data.get("jam_selesai", slot.jam_selesai)
        self.slot_waktu_policy.ensure_time_range_valid(new_jam_mulai, new_jam_selesai)

        for field, value in update_data.items():
            setattr(slot, field, value)

        await self.slot_waktu_repo.commit()
        await self.slot_waktu_repo.refresh(slot)
        return self._to_slot_waktu_dto(slot)

    async def delete_slot_waktu(self, slot_id: UUID) -> MessageResponseDTO:
        """
        Delete a time slot.

        Raises:
            HTTPException: 404 if time slot not found
            HTTPException: 500 if database error
        """
        slot = await self.slot_waktu_repo.find_by_id(slot_id)
        self.slot_waktu_policy.ensure_exists(slot)

        await self.slot_waktu_repo.delete(slot)
        await self.slot_waktu_repo.commit()
        return MessageResponseDTO(message="Time slot deleted successfully")

    async def copy_semester_structure(
        self, request: CopySemesterStructureDTO
    ) -> CopySemesterStructureResponseDTO:
        try:
            source_semester = await self.semester_repo.find_by_id(request.source_semester_id)
            self.semester_policy.ensure_exists(source_semester)
            tahun_ajaran = await self.semester_repo.find_tahun_ajaran_by_id(source_semester.tahun_ajaran_id)
            self.semester_policy.ensure_tahun_ajaran_exists(tahun_ajaran, source_semester.tahun_ajaran_id)
            self.semester_policy.ensure_date_range_valid(request.tanggal_mulai, request.tanggal_selesai)
            self.semester_policy.ensure_within_tahun_ajaran(
                tahun_ajaran, request.tanggal_mulai, request.tanggal_selesai
            )

            existing_target = await self.semester_repo.find_by_tahun_ajaran_and_tipe(
                source_semester.tahun_ajaran_id, request.tipe
            )
            self.semester_policy.ensure_unique_for_tahun_ajaran(existing_target, request.tipe)
            all_semesters = await self.semester_repo.list_by_tahun_ajaran(source_semester.tahun_ajaran_id)
            self.semester_policy.ensure_not_overlapping(
                all_semesters, request.tanggal_mulai, request.tanggal_selesai
            )

            target_semester = Semester(
                tahun_ajaran_id=source_semester.tahun_ajaran_id,
                tipe=request.tipe,
                tanggal_mulai=request.tanggal_mulai,
                tanggal_selesai=request.tanggal_selesai,
                is_active=request.is_active,
            )
            self.db.add(target_semester)
            await self.db.flush()

            copied_jadwal = 0
            copied_rapor_bobot = 0

            jadwal_result = await self.db.execute(
                select(Jadwal).where(Jadwal.semester_id == source_semester.semester_id)
            )
            for row in jadwal_result.scalars().all():
                self.db.add(
                    Jadwal(
                        semester_id=target_semester.semester_id,
                        kelas_id=row.kelas_id,
                        mapel_id=row.mapel_id,
                        guru_user_id=row.guru_user_id,
                        hari=row.hari,
                        slot_waktu_id=row.slot_waktu_id,
                    )
                )
                copied_jadwal += 1

            bobot_result = await self.db.execute(
                select(RaporBobot).where(RaporBobot.semester_id == source_semester.semester_id)
            )
            for row in bobot_result.scalars().all():
                self.db.add(
                    RaporBobot(
                        kelas_id=row.kelas_id,
                        semester_id=target_semester.semester_id,
                        mapel_id=row.mapel_id,
                        jenis_tugas=row.jenis_tugas,
                        bobot=row.bobot,
                    )
                )
                copied_rapor_bobot += 1

            await self.db.commit()
            await self.db.refresh(target_semester)

            return CopySemesterStructureResponseDTO(
                semester=self._to_semester_dto(target_semester),
                copied_jadwal=copied_jadwal,
                copied_rapor_bobot=copied_rapor_bobot,
            )
        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to copy semester structure: {str(e)}"
            )

    async def copy_tahun_ajaran_structure(
        self, request: CopyTahunAjaranStructureDTO
    ) -> CopyTahunAjaranStructureResponseDTO:
        try:
            self.tahun_ajaran_policy.ensure_date_range_valid(
                request.tanggal_mulai, request.tanggal_selesai
            )
            existing = await self.tahun_ajaran_repo.find_by_nama(request.nama)
            self.tahun_ajaran_policy.ensure_nama_available(
                is_taken=existing is not None,
                nama=request.nama,
            )
            all_tahun_ajaran = await self.tahun_ajaran_repo.list_all()
            self.tahun_ajaran_policy.ensure_not_overlapping(
                all_tahun_ajaran, request.tanggal_mulai, request.tanggal_selesai
            )

            source_tahun_ajaran = await self.tahun_ajaran_repo.find_by_id(request.source_tahun_ajaran_id)
            self.tahun_ajaran_policy.ensure_exists(source_tahun_ajaran)

            new_tahun_ajaran = TahunAjaran(
                nama=request.nama,
                tanggal_mulai=request.tanggal_mulai,
                tanggal_selesai=request.tanggal_selesai,
                is_active=request.is_active,
            )
            self.db.add(new_tahun_ajaran)
            await self.db.flush()

            copied_semester = 0
            copied_kelas = 0
            copied_guru_mapel = 0
            copied_kurikulum = 0

            kelas_map: dict[UUID, UUID] = {}

            year_shift = request.tanggal_mulai.year - source_tahun_ajaran.tanggal_mulai.year

            if request.copy_semester:
                source_semesters = await self.semester_repo.list_by_tahun_ajaran(source_tahun_ajaran.tahun_ajaran_id)
                for sem in source_semesters:
                    self.db.add(
                        Semester(
                            tahun_ajaran_id=new_tahun_ajaran.tahun_ajaran_id,
                            tipe=sem.tipe,
                            tanggal_mulai=self._shift_year(sem.tanggal_mulai, year_shift),
                            tanggal_selesai=self._shift_year(sem.tanggal_selesai, year_shift),
                            is_active=False,
                        )
                    )
                    copied_semester += 1

            if request.copy_kelas:
                source_kelas_result = await self.db.execute(
                    select(Kelas).where(Kelas.tahun_ajaran_id == source_tahun_ajaran.tahun_ajaran_id)
                )
                for source_kelas in source_kelas_result.scalars().all():
                    new_kelas = Kelas(
                        tahun_ajaran_id=new_tahun_ajaran.tahun_ajaran_id,
                        nama_kelas=source_kelas.nama_kelas,
                        tingkat=source_kelas.tingkat,
                        kategori_kelas_id=source_kelas.kategori_kelas_id,
                        jurusan=source_kelas.jurusan,
                        wali_kelas_id=source_kelas.wali_kelas_id,
                        kapasitas=source_kelas.kapasitas,
                    )
                    self.db.add(new_kelas)
                    await self.db.flush()
                    kelas_map[source_kelas.kelas_id] = new_kelas.kelas_id
                    copied_kelas += 1

            if request.copy_guru_mapel and kelas_map:
                source_gm_result = await self.db.execute(
                    select(GuruMapel).where(GuruMapel.tahun_ajaran_id == source_tahun_ajaran.tahun_ajaran_id)
                )
                for row in source_gm_result.scalars().all():
                    new_kelas_id = kelas_map.get(row.kelas_id)
                    if not new_kelas_id:
                        continue
                    self.db.add(
                        GuruMapel(
                            user_id=row.user_id,
                            mapel_id=row.mapel_id,
                            kelas_id=new_kelas_id,
                            tahun_ajaran_id=new_tahun_ajaran.tahun_ajaran_id,
                        )
                    )
                    copied_guru_mapel += 1

            if request.copy_kurikulum:
                source_kurikulum_result = await self.db.execute(
                    select(KurikulumMapel).where(
                        KurikulumMapel.tahun_ajaran_id == source_tahun_ajaran.tahun_ajaran_id
                    )
                )
                for row in source_kurikulum_result.scalars().all():
                    self.db.add(
                        KurikulumMapel(
                            mapel_id=row.mapel_id,
                            tahun_ajaran_id=new_tahun_ajaran.tahun_ajaran_id,
                            tingkat=row.tingkat,
                            kategori_kelas_id=row.kategori_kelas_id,
                            is_wajib=row.is_wajib,
                            jam_override=row.jam_override,
                        )
                    )
                    copied_kurikulum += 1

            await self.db.commit()
            await self.db.refresh(new_tahun_ajaran)

            return CopyTahunAjaranStructureResponseDTO(
                tahun_ajaran=self._to_tahun_ajaran_dto(new_tahun_ajaran),
                copied_semester=copied_semester,
                copied_kelas=copied_kelas,
                copied_guru_mapel=copied_guru_mapel,
                copied_kurikulum=copied_kurikulum,
            )
        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to copy academic year structure: {str(e)}"
            )

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _shift_year(self, value: date, year_shift: int) -> date:
        if year_shift == 0:
            return value
        target_year = value.year + year_shift
        try:
            return value.replace(year=target_year)
        except ValueError:
            return value.replace(year=target_year, day=28)

    def _to_tahun_ajaran_dto(self, tahun_ajaran: TahunAjaran) -> TahunAjaranResponseDTO:
        return TahunAjaranResponseDTO(
            tahun_ajaran_id=tahun_ajaran.tahun_ajaran_id,
            nama=tahun_ajaran.nama,
            tanggal_mulai=tahun_ajaran.tanggal_mulai,
            tanggal_selesai=tahun_ajaran.tanggal_selesai,
            is_active=tahun_ajaran.is_active,
        )

    def _to_semester_dto(self, semester: Semester) -> SemesterResponseDTO:
        return SemesterResponseDTO(
            semester_id=semester.semester_id,
            tahun_ajaran_id=semester.tahun_ajaran_id,
            tipe=semester.tipe,
            tanggal_mulai=semester.tanggal_mulai,
            tanggal_selesai=semester.tanggal_selesai,
            is_active=semester.is_active,
        )

    def _to_kalender_dto(self, kalender: KalenderAkademik) -> KalenderResponseDTO:
        return KalenderResponseDTO(
            kalender_id=kalender.kalender_id,
            tahun_ajaran_id=kalender.tahun_ajaran_id,
            tanggal=kalender.tanggal,
            jenis=kalender.jenis,
            keterangan=kalender.keterangan,
        )

    def _to_mapel_dto(self, mapel: MataPelajaran) -> MapelResponseDTO:
        return MapelResponseDTO(
            mapel_id=mapel.mapel_id,
            kode_mapel=mapel.kode_mapel,
            nama_mapel=mapel.nama_mapel,
            kelompok=mapel.kelompok,
            is_active=mapel.is_active,
        )

    def _to_slot_waktu_dto(self, slot: SlotWaktu) -> SlotWaktuResponseDTO:
        return SlotWaktuResponseDTO(
            slot_id=slot.slot_id,
            nama=slot.nama,
            jam_mulai=slot.jam_mulai,
            jam_selesai=slot.jam_selesai,
            urutan=slot.urutan,
            is_piket=slot.is_piket,
        )
