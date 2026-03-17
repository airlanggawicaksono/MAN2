from uuid import UUID
from datetime import datetime, timezone
from collections import defaultdict
from fastapi import HTTPException, status
from sqlalchemy import select, func, and_, case, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.rapor import Rapor, RaporNilai
from app.models.rapor_bobot import RaporBobot
from app.models.tugas import Tugas
from app.models.nilai import Nilai
from app.models.absensi import Absensi
from app.models.semester import Semester
from app.models.kelas import Kelas
from app.models.siswa_kelas import SiswaKelas
from app.models.guru_mapel import GuruMapel
from app.models.mata_pelajaran import MataPelajaran
from app.models.siswa_profile import SiswaProfile
from app.models.user import User
from app.enums import UserType, StatusAbsensi
from app.dto.rapor.rapor_dto import (
    GenerateRaporDTO, UpdateRaporDTO, OverrideNilaiDTO,
    SetRaporBobotDTO, RaporBobotResponseDTO,
    RaporResponseDTO, RaporNilaiResponseDTO, RaporListItemDTO,
    AttendanceSummaryDTO, GenerateRaporResponseDTO, MessageResponseDTO,
)


class RaporService:
    """
    Service for report card management.

    Raises:
        HTTPException: 400, 403, 404, 500
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Permission helpers ──────────────────────────────────────────────────

    async def _check_wali_kelas(self, kelas_id: UUID, current_user: User) -> Kelas:
        """
        Validate kelas exists and current_user is admin or wali kelas of the class.

        Raises:
            HTTPException: 404 if kelas not found
            HTTPException: 403 if user is guru but not wali kelas of this class
        """
        result = await self.db.execute(
            select(Kelas).where(Kelas.kelas_id == kelas_id)
        )
        kelas = result.scalar_one_or_none()
        if not kelas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas with ID {kelas_id} not found"
            )

        if current_user.user_type == UserType.guru:
            if kelas.wali_kelas_id != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only wali kelas of this class or admin can perform this action"
                )

        return kelas

    async def _check_rapor_access(self, rapor: Rapor, current_user: User) -> None:
        """
        Check that current_user is admin or wali kelas of the rapor's class.

        Raises:
            HTTPException: 403 if not authorized
        """
        if current_user.user_type == UserType.admin:
            return

        result = await self.db.execute(
            select(Kelas).where(Kelas.kelas_id == rapor.kelas_id)
        )
        kelas = result.scalar_one_or_none()
        if not kelas or kelas.wali_kelas_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only wali kelas of this class or admin can access this rapor"
            )

    # ── Grade calculation ───────────────────────────────────────────────────

    async def _calculate_grade(
        self, student_id: UUID, mapel_id: UUID, kelas_id: UUID, semester_id: UUID
    ) -> float:
        """
        Calculate final grade for a student in a subject.

        1. Get all tugas for (kelas, mapel, semester)
        2. Get nilai for this student on those tugas
        3. Group by jenis, average per jenis
        4. Simple average of all jenis averages
        """
        # Get all tugas IDs for this context
        tugas_result = await self.db.execute(
            select(Tugas).where(
                and_(
                    Tugas.kelas_id == kelas_id,
                    Tugas.mapel_id == mapel_id,
                    Tugas.semester_id == semester_id,
                )
            )
        )
        tugas_list = tugas_result.scalars().all()

        if not tugas_list:
            return 0.0

        tugas_ids = [t.tugas_id for t in tugas_list]
        tugas_jenis_map = {t.tugas_id: t.jenis for t in tugas_list}

        # Get nilai for student on these tugas
        nilai_result = await self.db.execute(
            select(Nilai).where(
                and_(
                    Nilai.tugas_id.in_(tugas_ids),
                    Nilai.user_id == student_id,
                )
            )
        )
        nilai_list = nilai_result.scalars().all()

        if not nilai_list:
            return 0.0

        # Group scores by jenis
        jenis_scores: dict[str, list[float]] = defaultdict(list)
        for n in nilai_list:
            jenis = tugas_jenis_map[n.tugas_id]
            jenis_scores[jenis.value].append(float(n.nilai))

        # Compute average per jenis
        jenis_avg: dict[str, float] = {}
        for jenis_val, scores in jenis_scores.items():
            jenis_avg[jenis_val] = sum(scores) / len(scores)

        # Try weighted mode if bobot is configured for this class+semester+mapel.
        # Fallback to equal-average mode if no bobot exists.
        bobot_result = await self.db.execute(
            select(RaporBobot).where(
                and_(
                    RaporBobot.kelas_id == kelas_id,
                    RaporBobot.semester_id == semester_id,
                    RaporBobot.mapel_id == mapel_id,
                )
            )
        )
        bobot_rows = bobot_result.scalars().all()

        if not bobot_rows:
            return round(sum(jenis_avg.values()) / len(jenis_avg), 2)

        weighted_total = 0.0
        total_weight = 0.0
        for row in bobot_rows:
            w = float(row.bobot)
            total_weight += w
            weighted_total += jenis_avg.get(row.jenis_tugas.value, 0.0) * w

        if total_weight <= 0:
            return 0.0
        return round(weighted_total / total_weight, 2)

    # ── Attendance summary ──────────────────────────────────────────────────

    async def _get_attendance_summary(
        self, user_id: UUID, semester_id: UUID
    ) -> AttendanceSummaryDTO:
        """Count attendance by status within semester date range."""
        # Get semester date range
        sem_result = await self.db.execute(
            select(Semester).where(Semester.semester_id == semester_id)
        )
        semester = sem_result.scalar_one_or_none()
        if not semester:
            return AttendanceSummaryDTO()

        result = await self.db.execute(
            select(
                Absensi.status,
                func.count().label("cnt")
            ).where(
                and_(
                    Absensi.user_id == user_id,
                    Absensi.tanggal >= semester.tanggal_mulai,
                    Absensi.tanggal <= semester.tanggal_selesai,
                )
            ).group_by(Absensi.status)
        )

        counts = {row.status: row.cnt for row in result.all()}

        return AttendanceSummaryDTO(
            hadir=counts.get(StatusAbsensi.hadir, 0),
            sakit=counts.get(StatusAbsensi.sakit, 0),
            izin=counts.get(StatusAbsensi.izin, 0),
            alfa=counts.get(StatusAbsensi.alfa, 0),
            terlambat=counts.get(StatusAbsensi.terlambat, 0),
        )

    # ── DTO converters ──────────────────────────────────────────────────────

    def _nilai_to_dto(self, rn: RaporNilai, mapel_nama: str) -> RaporNilaiResponseDTO:
        return RaporNilaiResponseDTO(
            rapor_nilai_id=rn.rapor_nilai_id,
            rapor_id=rn.rapor_id,
            mapel_id=rn.mapel_id,
            mapel_nama=mapel_nama,
            nilai_akhir=float(rn.nilai_akhir),
            is_manual_override=rn.is_manual_override,
            catatan=rn.catatan,
        )

    def _bobot_to_dto(self, bobot: RaporBobot) -> RaporBobotResponseDTO:
        return RaporBobotResponseDTO(
            rapor_bobot_id=bobot.rapor_bobot_id,
            kelas_id=bobot.kelas_id,
            semester_id=bobot.semester_id,
            mapel_id=bobot.mapel_id,
            jenis_tugas=bobot.jenis_tugas,
            bobot=float(bobot.bobot),
        )

    async def set_rapor_bobot(
        self, request: SetRaporBobotDTO, current_user: User
    ) -> list[RaporBobotResponseDTO]:
        """
        Configure grade weights (bobot) for a class+semester+subject.
        Allowed for admin or wali kelas.
        """
        try:
            await self._check_wali_kelas(request.kelas_id, current_user)

            sem_result = await self.db.execute(
                select(Semester).where(Semester.semester_id == request.semester_id)
            )
            if not sem_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Semester with ID {request.semester_id} not found",
                )

            mapel_result = await self.db.execute(
                select(MataPelajaran).where(MataPelajaran.mapel_id == request.mapel_id)
            )
            if not mapel_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Mata pelajaran with ID {request.mapel_id} not found",
                )

            seen = set()
            total = 0.0
            for w in request.weights:
                if w.jenis_tugas in seen:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Duplicate jenis_tugas: {w.jenis_tugas.value}",
                    )
                seen.add(w.jenis_tugas)
                total += float(w.bobot)

            if round(total, 2) != 100.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Total bobot must equal 100. Current total: {round(total, 2)}",
                )

            existing_result = await self.db.execute(
                select(RaporBobot).where(
                    and_(
                        RaporBobot.kelas_id == request.kelas_id,
                        RaporBobot.semester_id == request.semester_id,
                        RaporBobot.mapel_id == request.mapel_id,
                    )
                )
            )
            for row in existing_result.scalars().all():
                await self.db.delete(row)

            new_rows: list[RaporBobot] = []
            for item in request.weights:
                row = RaporBobot(
                    kelas_id=request.kelas_id,
                    semester_id=request.semester_id,
                    mapel_id=request.mapel_id,
                    jenis_tugas=item.jenis_tugas,
                    bobot=item.bobot,
                )
                self.db.add(row)
                new_rows.append(row)

            await self.db.commit()
            for row in new_rows:
                await self.db.refresh(row)

            return [self._bobot_to_dto(r) for r in new_rows]

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to set rapor bobot: {str(e)}",
            )

    async def list_rapor_bobot(
        self,
        kelas_id: UUID,
        semester_id: UUID,
        mapel_id: UUID,
        current_user: User,
    ) -> list[RaporBobotResponseDTO]:
        await self._check_wali_kelas(kelas_id, current_user)

        result = await self.db.execute(
            select(RaporBobot).where(
                and_(
                    RaporBobot.kelas_id == kelas_id,
                    RaporBobot.semester_id == semester_id,
                    RaporBobot.mapel_id == mapel_id,
                )
            )
        )
        rows = result.scalars().all()
        return [self._bobot_to_dto(r) for r in rows]

    async def _rapor_to_full_dto(self, rapor: Rapor) -> RaporResponseDTO:
        """Build full rapor response with grades and attendance summary."""
        # Load nilai_list with mapel relationship
        result = await self.db.execute(
            select(RaporNilai)
            .options(selectinload(RaporNilai.mapel))
            .where(RaporNilai.rapor_id == rapor.rapor_id)
        )
        nilai_entries = result.scalars().all()

        grades = [
            self._nilai_to_dto(rn, rn.mapel.nama_mapel)
            for rn in nilai_entries
        ]

        attendance = await self._get_attendance_summary(
            rapor.user_id, rapor.semester_id
        )

        return RaporResponseDTO(
            rapor_id=rapor.rapor_id,
            user_id=rapor.user_id,
            semester_id=rapor.semester_id,
            kelas_id=rapor.kelas_id,
            catatan_wali_kelas=rapor.catatan_wali_kelas,
            is_published=rapor.is_published,
            published_at=rapor.published_at,
            grades=grades,
            attendance_summary=attendance,
        )

    # ── Generate rapor ──────────────────────────────────────────────────────

    async def generate_rapor(
        self, request: GenerateRaporDTO, current_user: User
    ) -> GenerateRaporResponseDTO:
        """
        Generate rapor entries for all students in a class.
        Auto-calculates grades from nilai.

        Raises:
            HTTPException: 404 if kelas/semester not found
            HTTPException: 403 if not admin/wali kelas
            HTTPException: 500 on database error
        """
        try:
            # Validate semester
            sem_result = await self.db.execute(
                select(Semester).where(Semester.semester_id == request.semester_id)
            )
            if not sem_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Semester with ID {request.semester_id} not found"
                )

            # Validate kelas + permission
            kelas = await self._check_wali_kelas(request.kelas_id, current_user)

            # Get all students in this kelas
            students_result = await self.db.execute(
                select(SiswaKelas.user_id).where(
                    SiswaKelas.kelas_id == request.kelas_id
                )
            )
            student_ids = [row for row in students_result.scalars().all()]

            if not student_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No students found in this class"
                )

            # Get all mapel taught in this kelas (distinct mapel_id from guru_mapel)
            mapel_result = await self.db.execute(
                select(distinct(GuruMapel.mapel_id)).where(
                    GuruMapel.kelas_id == request.kelas_id
                )
            )
            mapel_ids = [row for row in mapel_result.scalars().all()]

            if not mapel_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No subjects assigned to this class"
                )

            generated = 0
            skipped = 0

            for student_id in student_ids:
                # Check if rapor already exists
                existing = await self.db.execute(
                    select(Rapor).where(
                        and_(
                            Rapor.user_id == student_id,
                            Rapor.semester_id == request.semester_id,
                        )
                    )
                )
                rapor = existing.scalar_one_or_none()

                if rapor:
                    skipped += 1
                    continue

                # Create rapor entry
                rapor = Rapor(
                    user_id=student_id,
                    semester_id=request.semester_id,
                    kelas_id=request.kelas_id,
                )
                self.db.add(rapor)
                await self.db.flush()

                # Calculate and create rapor_nilai for each mapel
                for mapel_id in mapel_ids:
                    grade = await self._calculate_grade(
                        student_id, mapel_id, request.kelas_id, request.semester_id
                    )
                    rapor_nilai = RaporNilai(
                        rapor_id=rapor.rapor_id,
                        mapel_id=mapel_id,
                        nilai_akhir=grade,
                    )
                    self.db.add(rapor_nilai)

                generated += 1

            await self.db.commit()

            return GenerateRaporResponseDTO(
                message=f"Rapor generation complete for class {kelas.nama_kelas}",
                rapor_generated=generated,
                rapor_skipped=skipped,
            )

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate rapor: {str(e)}"
            )

    # ── List rapor by kelas ─────────────────────────────────────────────────

    async def list_rapor_by_kelas(
        self, kelas_id: UUID, semester_id: UUID, current_user: User
    ) -> list[RaporListItemDTO]:
        """
        List all rapor for a class in a semester.

        Raises:
            HTTPException: 404 if kelas not found
            HTTPException: 403 if not admin/wali kelas
        """
        await self._check_wali_kelas(kelas_id, current_user)

        result = await self.db.execute(
            select(Rapor, User.username, SiswaProfile.nama_lengkap)
            .join(User, Rapor.user_id == User.user_id)
            .outerjoin(SiswaProfile, SiswaProfile.user_id == User.user_id)
            .where(
                and_(
                    Rapor.kelas_id == kelas_id,
                    Rapor.semester_id == semester_id,
                )
            )
            .order_by(SiswaProfile.nama_lengkap)
        )

        items = []
        for row in result.all():
            rapor = row[0]
            username = row[1]
            nama_lengkap = row[2] or username
            items.append(RaporListItemDTO(
                rapor_id=rapor.rapor_id,
                user_id=rapor.user_id,
                username=username,
                nama_lengkap=nama_lengkap,
                is_published=rapor.is_published,
                published_at=rapor.published_at,
            ))

        return items

    # ── Get single rapor ────────────────────────────────────────────────────

    async def get_rapor(
        self, rapor_id: UUID, current_user: User
    ) -> RaporResponseDTO:
        """
        Get full rapor with grades and attendance summary.

        Raises:
            HTTPException: 404 if rapor not found
            HTTPException: 403 if not authorized
        """
        result = await self.db.execute(
            select(Rapor).where(Rapor.rapor_id == rapor_id)
        )
        rapor = result.scalar_one_or_none()
        if not rapor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rapor with ID {rapor_id} not found"
            )

        await self._check_rapor_access(rapor, current_user)
        return await self._rapor_to_full_dto(rapor)

    # ── Update rapor (catatan wali kelas) ───────────────────────────────────

    async def update_rapor(
        self, rapor_id: UUID, request: UpdateRaporDTO, current_user: User
    ) -> RaporResponseDTO:
        """
        Update catatan_wali_kelas on a rapor.

        Raises:
            HTTPException: 404 if rapor not found
            HTTPException: 403 if not authorized
            HTTPException: 400 if no fields to update
            HTTPException: 500 on database error
        """
        try:
            result = await self.db.execute(
                select(Rapor).where(Rapor.rapor_id == rapor_id)
            )
            rapor = result.scalar_one_or_none()
            if not rapor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Rapor with ID {rapor_id} not found"
                )

            await self._check_rapor_access(rapor, current_user)

            update_data = request.model_dump(exclude_unset=True)
            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )

            for field, value in update_data.items():
                setattr(rapor, field, value)

            await self.db.commit()
            await self.db.refresh(rapor)

            return await self._rapor_to_full_dto(rapor)

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update rapor: {str(e)}"
            )

    # ── Override nilai ──────────────────────────────────────────────────────

    async def override_nilai(
        self, rapor_nilai_id: UUID, request: OverrideNilaiDTO, current_user: User
    ) -> RaporNilaiResponseDTO:
        """
        Manually override a grade in rapor_nilai.

        Raises:
            HTTPException: 404 if rapor_nilai not found
            HTTPException: 403 if not authorized
            HTTPException: 500 on database error
        """
        try:
            result = await self.db.execute(
                select(RaporNilai)
                .options(selectinload(RaporNilai.mapel))
                .where(RaporNilai.rapor_nilai_id == rapor_nilai_id)
            )
            rapor_nilai = result.scalar_one_or_none()
            if not rapor_nilai:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"RaporNilai with ID {rapor_nilai_id} not found"
                )

            # Check access via parent rapor
            rapor_result = await self.db.execute(
                select(Rapor).where(Rapor.rapor_id == rapor_nilai.rapor_id)
            )
            rapor = rapor_result.scalar_one_or_none()
            if not rapor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent rapor not found"
                )

            await self._check_rapor_access(rapor, current_user)

            rapor_nilai.nilai_akhir = request.nilai_akhir
            rapor_nilai.is_manual_override = True
            if request.catatan is not None:
                rapor_nilai.catatan = request.catatan

            await self.db.commit()
            await self.db.refresh(rapor_nilai)

            return self._nilai_to_dto(rapor_nilai, rapor_nilai.mapel.nama_mapel)

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to override nilai: {str(e)}"
            )

    # ── Recalculate rapor ───────────────────────────────────────────────────

    async def recalculate_rapor(
        self, rapor_id: UUID, current_user: User
    ) -> RaporResponseDTO:
        """
        Re-calculate all grades for a rapor from raw nilai.
        Resets manual overrides.

        Raises:
            HTTPException: 404 if rapor not found
            HTTPException: 403 if not authorized
            HTTPException: 500 on database error
        """
        try:
            result = await self.db.execute(
                select(Rapor).where(Rapor.rapor_id == rapor_id)
            )
            rapor = result.scalar_one_or_none()
            if not rapor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Rapor with ID {rapor_id} not found"
                )

            await self._check_rapor_access(rapor, current_user)

            # Get existing rapor_nilai entries
            nilai_result = await self.db.execute(
                select(RaporNilai).where(RaporNilai.rapor_id == rapor_id)
            )
            nilai_entries = nilai_result.scalars().all()

            for rn in nilai_entries:
                grade = await self._calculate_grade(
                    rapor.user_id, rn.mapel_id, rapor.kelas_id, rapor.semester_id
                )
                rn.nilai_akhir = grade
                rn.is_manual_override = False

            await self.db.commit()

            return await self._rapor_to_full_dto(rapor)

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to recalculate rapor: {str(e)}"
            )

    # ── Publish single rapor ────────────────────────────────────────────────

    async def publish_rapor(
        self, rapor_id: UUID, current_user: User
    ) -> RaporResponseDTO:
        """
        Publish a single rapor.

        Raises:
            HTTPException: 404 if rapor not found
            HTTPException: 403 if not authorized
            HTTPException: 400 if no grades exist
            HTTPException: 500 on database error
        """
        try:
            result = await self.db.execute(
                select(Rapor).where(Rapor.rapor_id == rapor_id)
            )
            rapor = result.scalar_one_or_none()
            if not rapor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Rapor with ID {rapor_id} not found"
                )

            await self._check_rapor_access(rapor, current_user)

            # Check completeness: must have at least one rapor_nilai
            count_result = await self.db.execute(
                select(func.count()).where(RaporNilai.rapor_id == rapor_id)
            )
            count = count_result.scalar()
            if not count or count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot publish rapor with no grades"
                )

            rapor.is_published = True
            rapor.published_at = datetime.now(timezone.utc)
            rapor.published_by = current_user.user_id

            await self.db.commit()
            await self.db.refresh(rapor)

            return await self._rapor_to_full_dto(rapor)

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to publish rapor: {str(e)}"
            )

    # ── Publish all rapor for a kelas ───────────────────────────────────────

    async def publish_all(
        self, kelas_id: UUID, semester_id: UUID, current_user: User
    ) -> MessageResponseDTO:
        """
        Publish all unpublished rapor for a class in a semester.

        Raises:
            HTTPException: 404 if kelas not found
            HTTPException: 403 if not admin/wali kelas
            HTTPException: 500 on database error
        """
        try:
            await self._check_wali_kelas(kelas_id, current_user)

            result = await self.db.execute(
                select(Rapor).where(
                    and_(
                        Rapor.kelas_id == kelas_id,
                        Rapor.semester_id == semester_id,
                        Rapor.is_published == False,
                    )
                )
            )
            unpublished = result.scalars().all()

            now = datetime.now(timezone.utc)
            published_count = 0

            for rapor in unpublished:
                # Check has grades
                count_result = await self.db.execute(
                    select(func.count()).where(RaporNilai.rapor_id == rapor.rapor_id)
                )
                count = count_result.scalar()
                if count and count > 0:
                    rapor.is_published = True
                    rapor.published_at = now
                    rapor.published_by = current_user.user_id
                    published_count += 1

            await self.db.commit()

            return MessageResponseDTO(
                message=f"Published {published_count} rapor for this class"
            )

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to publish rapor: {str(e)}"
            )

    # ── Student view ────────────────────────────────────────────────────────

    async def get_my_rapor(
        self, semester_id: UUID, current_user: User
    ) -> RaporResponseDTO:
        """
        Get own published rapor for a semester (student view).

        Raises:
            HTTPException: 404 if no published rapor found
        """
        result = await self.db.execute(
            select(Rapor).where(
                and_(
                    Rapor.user_id == current_user.user_id,
                    Rapor.semester_id == semester_id,
                )
            )
        )
        rapor = result.scalar_one_or_none()

        if not rapor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No rapor found for this semester"
            )

        if not rapor.is_published:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Your rapor for this semester has not been published yet"
            )

        return await self._rapor_to_full_dto(rapor)
