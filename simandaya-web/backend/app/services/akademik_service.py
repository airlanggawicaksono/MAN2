from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tahun_ajaran import TahunAjaran
from app.models.semester import Semester
from app.models.kalender_akademik import KalenderAkademik
from app.models.mata_pelajaran import MataPelajaran
from app.models.slot_waktu import SlotWaktu
from app.policy.kalender_policy import KalenderPolicy
from app.policy.mapel_policy import MapelPolicy
from app.policy.semester_policy import SemesterPolicy
from app.policy.slot_waktu_policy import SlotWaktuPolicy
from app.policy.tahun_ajaran_policy import TahunAjaranPolicy
from app.repositoriy.kalender_repository import KalenderRepository
from app.repositoriy.mapel_repository import MapelRepository
from app.repositoriy.semester_repository import SemesterRepository
from app.repositoriy.slot_waktu_repository import SlotWaktuRepository
from app.repositoriy.tahun_ajaran_repository import TahunAjaranRepository
from app.dto.akademik.tahun_ajaran_dto import (
    CreateTahunAjaranDTO, UpdateTahunAjaranDTO, TahunAjaranResponseDTO
)
from app.dto.akademik.semester_dto import (
    CreateSemesterDTO, UpdateSemesterDTO, SemesterResponseDTO
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
            existing = await self.tahun_ajaran_repo.find_by_nama(request.nama)
            self.tahun_ajaran_policy.ensure_nama_available(
                is_taken=existing is not None,
                nama=request.nama,
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

            semester_check = await self.semester_repo.find_by_tahun_ajaran_and_tipe(
                request.tahun_ajaran_id, request.tipe
            )
            self.semester_policy.ensure_unique_for_tahun_ajaran(
                semester_check, request.tipe
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
                jam_per_minggu=request.jam_per_minggu,
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

    # ── Helpers ──────────────────────────────────────────────────────────────

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
            jam_per_minggu=mapel.jam_per_minggu,
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
