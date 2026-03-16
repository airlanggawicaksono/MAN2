from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.guru_mapel import GuruMapel
from app.models.jadwal import Jadwal
from app.models.user import User
from app.models.mata_pelajaran import MataPelajaran
from app.models.kelas import Kelas
from app.models.semester import Semester
from app.models.slot_waktu import SlotWaktu
from app.models.tahun_ajaran import TahunAjaran
from app.dto.akademik.guru_mapel_dto import (
    CreateGuruMapelDTO,
    GuruMapelResponseDTO,
    MessageResponseDTO
)
from app.dto.akademik.jadwal_dto import (
    CreateJadwalDTO,
    UpdateJadwalDTO,
    JadwalResponseDTO
)
from app.enums import UserType


class JadwalService:
    """
    Service for managing GuruMapel (teacher-subject-class assignments) and Jadwal (timetable).

    Handles CRUD operations with validation and clash detection for scheduling conflicts.

    Raises:
        HTTPException: 400 (validation/clash), 404 (not found)
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── GuruMapel Methods ────────────────────────────────────────────────────

    async def create_guru_mapel(self, request: CreateGuruMapelDTO) -> GuruMapelResponseDTO:
        """
        Assign a teacher to a subject and class for an academic year.

        Args:
            request: CreateGuruMapelDTO with user_id, mapel_id, kelas_id, tahun_ajaran_id

        Returns:
            GuruMapelResponseDTO: Created assignment

        Raises:
            HTTPException: 400 if validation fails or assignment already exists
            HTTPException: 404 if referenced entities don't exist
        """
        # Validate user_id is a guru
        result = await self.db.execute(
            select(User).where(User.user_id == request.user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {request.user_id} not found"
            )
        if user.user_type != UserType.guru:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {request.user_id} is not a guru"
            )

        # Validate mapel_id exists
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.mapel_id == request.mapel_id)
        )
        mapel = result.scalar_one_or_none()
        if not mapel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mata pelajaran with ID {request.mapel_id} not found"
            )

        # Validate kelas_id exists
        result = await self.db.execute(
            select(Kelas).where(Kelas.kelas_id == request.kelas_id)
        )
        kelas = result.scalar_one_or_none()
        if not kelas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas with ID {request.kelas_id} not found"
            )

        # Validate tahun_ajaran_id exists
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.tahun_ajaran_id == request.tahun_ajaran_id)
        )
        tahun_ajaran = result.scalar_one_or_none()
        if not tahun_ajaran:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tahun ajaran with ID {request.tahun_ajaran_id} not found"
            )

        # Check uniqueness of (user_id, mapel_id, kelas_id, tahun_ajaran_id)
        result = await self.db.execute(
            select(GuruMapel).where(
                and_(
                    GuruMapel.user_id == request.user_id,
                    GuruMapel.mapel_id == request.mapel_id,
                    GuruMapel.kelas_id == request.kelas_id,
                    GuruMapel.tahun_ajaran_id == request.tahun_ajaran_id,
                )
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This guru-mapel-kelas-tahun assignment already exists"
            )

        # Create GuruMapel
        guru_mapel = GuruMapel(
            user_id=request.user_id,
            mapel_id=request.mapel_id,
            kelas_id=request.kelas_id,
            tahun_ajaran_id=request.tahun_ajaran_id,
        )

        self.db.add(guru_mapel)
        await self.db.commit()

        # Re-fetch with relationships loaded
        result = await self.db.execute(
            select(GuruMapel)
            .where(GuruMapel.guru_mapel_id == guru_mapel.guru_mapel_id)
            .options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        guru_mapel = result.scalar_one()

        return self._to_guru_mapel_dto(guru_mapel)

    async def list_guru_mapel(self) -> list[GuruMapelResponseDTO]:
        """
        List all guru-mapel assignments.

        Returns:
            list[GuruMapelResponseDTO]: All assignments
        """
        result = await self.db.execute(
            select(GuruMapel)
            .options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        guru_mapels = result.scalars().all()
        return [self._to_guru_mapel_dto(gm) for gm in guru_mapels]

    async def list_guru_mapel_by_guru(self, user_id: UUID) -> list[GuruMapelResponseDTO]:
        """
        List all guru-mapel assignments for a specific teacher.

        Args:
            user_id: Teacher's user_id

        Returns:
            list[GuruMapelResponseDTO]: Assignments for the teacher
        """
        result = await self.db.execute(
            select(GuruMapel)
            .where(GuruMapel.user_id == user_id)
            .options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        guru_mapels = result.scalars().all()
        return [self._to_guru_mapel_dto(gm) for gm in guru_mapels]

    async def list_guru_mapel_by_kelas(self, kelas_id: UUID) -> list[GuruMapelResponseDTO]:
        """
        List all guru-mapel assignments for a specific class.

        Args:
            kelas_id: Class ID

        Returns:
            list[GuruMapelResponseDTO]: Assignments for the class
        """
        result = await self.db.execute(
            select(GuruMapel)
            .where(GuruMapel.kelas_id == kelas_id)
            .options(
                selectinload(GuruMapel.user).selectinload(User.guru_profile),
                selectinload(GuruMapel.mapel),
                selectinload(GuruMapel.kelas),
            )
        )
        guru_mapels = result.scalars().all()
        return [self._to_guru_mapel_dto(gm) for gm in guru_mapels]

    async def delete_guru_mapel(self, guru_mapel_id: UUID) -> MessageResponseDTO:
        """
        Delete a guru-mapel assignment.

        Args:
            guru_mapel_id: GuruMapel ID to delete

        Returns:
            MessageResponseDTO: Success message

        Raises:
            HTTPException: 404 if not found
        """
        result = await self.db.execute(
            select(GuruMapel).where(GuruMapel.guru_mapel_id == guru_mapel_id)
        )
        guru_mapel = result.scalar_one_or_none()
        if not guru_mapel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GuruMapel with ID {guru_mapel_id} not found"
            )

        await self.db.delete(guru_mapel)
        await self.db.commit()

        return MessageResponseDTO(message="GuruMapel deleted successfully")

    # ── Jadwal Methods ───────────────────────────────────────────────────────

    async def create_jadwal(self, request: CreateJadwalDTO) -> JadwalResponseDTO:
        """
        Create a timetable entry with clash validation.

        Validates that:
        - No class conflict at the same time slot
        - No teacher conflict at the same time slot

        Args:
            request: CreateJadwalDTO with schedule details

        Returns:
            JadwalResponseDTO: Created schedule entry

        Raises:
            HTTPException: 400 if clash detected or validation fails
            HTTPException: 404 if referenced entities don't exist
        """
        # Validate semester_id exists
        result = await self.db.execute(
            select(Semester).where(Semester.semester_id == request.semester_id)
        )
        semester = result.scalar_one_or_none()
        if not semester:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Semester with ID {request.semester_id} not found"
            )

        # Validate kelas_id exists
        result = await self.db.execute(
            select(Kelas).where(Kelas.kelas_id == request.kelas_id)
        )
        kelas = result.scalar_one_or_none()
        if not kelas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas with ID {request.kelas_id} not found"
            )

        # Validate mapel_id exists
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.mapel_id == request.mapel_id)
        )
        mapel = result.scalar_one_or_none()
        if not mapel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mata pelajaran with ID {request.mapel_id} not found"
            )

        # Validate guru_user_id is a guru
        result = await self.db.execute(
            select(User).where(User.user_id == request.guru_user_id)
        )
        guru = result.scalar_one_or_none()
        if not guru:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {request.guru_user_id} not found"
            )
        if guru.user_type != UserType.guru:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {request.guru_user_id} is not a guru"
            )

        # Validate slot_waktu_id exists
        result = await self.db.execute(
            select(SlotWaktu).where(SlotWaktu.slot_id == request.slot_waktu_id)
        )
        slot_waktu = result.scalar_one_or_none()
        if not slot_waktu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Slot waktu with ID {request.slot_waktu_id} not found"
            )

        # CLASH VALIDATION: Check class conflict
        result = await self.db.execute(
            select(Jadwal).where(
                and_(
                    Jadwal.semester_id == request.semester_id,
                    Jadwal.hari == request.hari,
                    Jadwal.slot_waktu_id == request.slot_waktu_id,
                    Jadwal.kelas_id == request.kelas_id,
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class already has a lesson at this time slot"
            )

        # CLASH VALIDATION: Check teacher conflict
        result = await self.db.execute(
            select(Jadwal).where(
                and_(
                    Jadwal.semester_id == request.semester_id,
                    Jadwal.hari == request.hari,
                    Jadwal.slot_waktu_id == request.slot_waktu_id,
                    Jadwal.guru_user_id == request.guru_user_id,
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher already has a lesson at this time slot"
            )

        # Create Jadwal
        jadwal = Jadwal(
            semester_id=request.semester_id,
            kelas_id=request.kelas_id,
            mapel_id=request.mapel_id,
            guru_user_id=request.guru_user_id,
            hari=request.hari,
            slot_waktu_id=request.slot_waktu_id,
        )

        self.db.add(jadwal)
        await self.db.commit()
        await self.db.refresh(jadwal)

        return self._to_jadwal_dto(jadwal)

    async def list_jadwal_by_semester(self, semester_id: UUID) -> list[JadwalResponseDTO]:
        """
        List all timetable entries for a specific semester.

        Args:
            semester_id: Semester ID

        Returns:
            list[JadwalResponseDTO]: Timetable entries
        """
        result = await self.db.execute(
            select(Jadwal).where(Jadwal.semester_id == semester_id)
        )
        jadwals = result.scalars().all()
        return [self._to_jadwal_dto(j) for j in jadwals]

    async def list_jadwal_by_kelas(self, kelas_id: UUID) -> list[JadwalResponseDTO]:
        """
        List all timetable entries for a specific class.

        Args:
            kelas_id: Class ID

        Returns:
            list[JadwalResponseDTO]: Timetable entries
        """
        result = await self.db.execute(
            select(Jadwal).where(Jadwal.kelas_id == kelas_id)
        )
        jadwals = result.scalars().all()
        return [self._to_jadwal_dto(j) for j in jadwals]

    async def list_jadwal_by_guru(self, user_id: UUID) -> list[JadwalResponseDTO]:
        """
        List all timetable entries for a specific teacher.

        Args:
            user_id: Teacher's user_id

        Returns:
            list[JadwalResponseDTO]: Timetable entries
        """
        result = await self.db.execute(
            select(Jadwal).where(Jadwal.guru_user_id == user_id)
        )
        jadwals = result.scalars().all()
        return [self._to_jadwal_dto(j) for j in jadwals]

    async def get_student_jadwal(self, user_id: UUID) -> list[JadwalResponseDTO]:
        """
        Get the current timetable for a student based on their class.
        """
        # First find the student's class
        result = await self.db.execute(
            select(SiswaKelas.kelas_id).where(SiswaKelas.user_id == user_id)
        )
        kelas_id = result.scalar_one_or_none()
        if not kelas_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student is not assigned to any class"
            )
        
        # Then get the jadwal for that class
        return await self.list_jadwal_by_kelas(kelas_id)

    async def update_jadwal(self, jadwal_id: UUID, request: UpdateJadwalDTO) -> JadwalResponseDTO:
        """
        Update a timetable entry with clash re-validation.

        Args:
            jadwal_id: Jadwal ID to update
            request: UpdateJadwalDTO with optional fields

        Returns:
            JadwalResponseDTO: Updated timetable entry

        Raises:
            HTTPException: 400 if clash detected or no updates provided
            HTTPException: 404 if jadwal or referenced entities not found
        """
        # Get existing jadwal
        result = await self.db.execute(
            select(Jadwal).where(Jadwal.jadwal_id == jadwal_id)
        )
        jadwal = result.scalar_one_or_none()
        if not jadwal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Jadwal with ID {jadwal_id} not found"
            )

        # Get update data
        update_data = request.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        # Validate mapel_id if provided
        if "mapel_id" in update_data:
            result = await self.db.execute(
                select(MataPelajaran).where(MataPelajaran.mapel_id == update_data["mapel_id"])
            )
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Mata pelajaran with ID {update_data['mapel_id']} not found"
                )

        # Validate guru_user_id if provided
        if "guru_user_id" in update_data:
            result = await self.db.execute(
                select(User).where(User.user_id == update_data["guru_user_id"])
            )
            guru = result.scalar_one_or_none()
            if not guru:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with ID {update_data['guru_user_id']} not found"
                )
            if guru.user_type != UserType.guru:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User {update_data['guru_user_id']} is not a guru"
                )

        # Validate slot_waktu_id if provided
        if "slot_waktu_id" in update_data:
            result = await self.db.execute(
                select(SlotWaktu).where(SlotWaktu.slot_id == update_data["slot_waktu_id"])
            )
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Slot waktu with ID {update_data['slot_waktu_id']} not found"
                )

        # Prepare new values for clash validation (merge existing with updates)
        new_hari = update_data.get("hari", jadwal.hari)
        new_slot_waktu_id = update_data.get("slot_waktu_id", jadwal.slot_waktu_id)
        new_guru_user_id = update_data.get("guru_user_id", jadwal.guru_user_id)

        # CLASH VALIDATION: Check class conflict (excluding self)
        result = await self.db.execute(
            select(Jadwal).where(
                and_(
                    Jadwal.jadwal_id != jadwal_id,
                    Jadwal.semester_id == jadwal.semester_id,
                    Jadwal.hari == new_hari,
                    Jadwal.slot_waktu_id == new_slot_waktu_id,
                    Jadwal.kelas_id == jadwal.kelas_id,
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class already has a lesson at this time slot"
            )

        # CLASH VALIDATION: Check teacher conflict (excluding self)
        result = await self.db.execute(
            select(Jadwal).where(
                and_(
                    Jadwal.jadwal_id != jadwal_id,
                    Jadwal.semester_id == jadwal.semester_id,
                    Jadwal.hari == new_hari,
                    Jadwal.slot_waktu_id == new_slot_waktu_id,
                    Jadwal.guru_user_id == new_guru_user_id,
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher already has a lesson at this time slot"
            )

        # Apply updates
        for field, value in update_data.items():
            setattr(jadwal, field, value)

        await self.db.commit()
        await self.db.refresh(jadwal)

        return self._to_jadwal_dto(jadwal)

    async def delete_jadwal(self, jadwal_id: UUID) -> MessageResponseDTO:
        """
        Delete a timetable entry.

        Args:
            jadwal_id: Jadwal ID to delete

        Returns:
            MessageResponseDTO: Success message

        Raises:
            HTTPException: 404 if not found
        """
        result = await self.db.execute(
            select(Jadwal).where(Jadwal.jadwal_id == jadwal_id)
        )
        jadwal = result.scalar_one_or_none()
        if not jadwal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Jadwal with ID {jadwal_id} not found"
            )

        await self.db.delete(jadwal)
        await self.db.commit()

        return MessageResponseDTO(message="Jadwal deleted successfully")

    # ── Helper Methods ───────────────────────────────────────────────────────

    def _to_guru_mapel_dto(self, guru_mapel: GuruMapel) -> GuruMapelResponseDTO:
        """Convert GuruMapel model to DTO."""
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
        """Convert Jadwal model to DTO."""
        return JadwalResponseDTO(
            jadwal_id=jadwal.jadwal_id,
            semester_id=jadwal.semester_id,
            kelas_id=jadwal.kelas_id,
            mapel_id=jadwal.mapel_id,
            guru_user_id=jadwal.guru_user_id,
            hari=jadwal.hari,
            slot_waktu_id=jadwal.slot_waktu_id,
        )
