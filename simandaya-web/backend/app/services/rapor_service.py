from uuid import UUID
from datetime import datetime, timezone
from collections import defaultdict
from fastapi import HTTPException, status
from sqlalchemy import select, func, and_, distinct
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
from app.models.tahun_ajaran import TahunAjaran
from app.models.user import User
from app.enums import UserType, StatusAbsensi, JenisTugas, TingkatKelas, TipeSemester
from app.repositoriy.student_semester_repository import StudentSemesterRepository
from app.dto.rapor.rapor_dto import (
    GenerateRaporDTO, UpdateRaporDTO, OverrideNilaiDTO, SaveRaporEditorDTO,
    SetRaporBobotDTO, RaporBobotResponseDTO,
    RaporResponseDTO, RaporNilaiResponseDTO, RaporListItemDTO, RaporEditorResponseDTO,
    GuruRaporContextResponseDTO, GuruRaporContextTahunAjaranDTO,
    GuruRaporContextSemesterDTO, GuruRaporContextKelasDTO,
    RaporKomponenNilaiDTO, RaporTugasNilaiDTO,
    AttendanceSummaryDTO, GenerateRaporResponseDTO,
)


class RaporService:
    """
    Service for report card management.

    Raises:
        HTTPException: 400, 403, 404, 500
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.student_semester_repo = StudentSemesterRepository(db)

    # â”€â”€ Permission helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async def _get_kelas_or_404(self, kelas_id: UUID) -> Kelas:
        result = await self.db.execute(select(Kelas).where(Kelas.kelas_id == kelas_id))
        kelas = result.scalar_one_or_none()
        if not kelas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas with ID {kelas_id} not found",
            )
        return kelas

    async def _get_semester_or_404(self, semester_id: UUID) -> Semester:
        result = await self.db.execute(select(Semester).where(Semester.semester_id == semester_id))
        semester = result.scalar_one_or_none()
        if not semester:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Semester with ID {semester_id} not found",
            )
        return semester

    @staticmethod
    def _ensure_kelas_semester_same_tahun(kelas: Kelas, semester: Semester) -> None:
        if kelas.tahun_ajaran_id != semester.tahun_ajaran_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kelas dan semester harus berada pada tahun ajaran yang sama",
            )

    async def _is_guru_assigned_to_kelas_tahun(
        self, user_id: UUID, kelas_id: UUID, tahun_ajaran_id: UUID
    ) -> bool:
        result = await self.db.execute(
            select(func.count())
            .select_from(GuruMapel)
            .where(
                and_(
                    GuruMapel.user_id == user_id,
                    GuruMapel.kelas_id == kelas_id,
                    GuruMapel.tahun_ajaran_id == tahun_ajaran_id,
                )
            )
        )
        return int(result.scalar() or 0) > 0

    async def _resolve_rapor_access_context(
        self, kelas_id: UUID, semester_id: UUID, current_user: User
    ) -> tuple[Kelas, Semester]:
        kelas = await self._get_kelas_or_404(kelas_id)
        semester = await self._get_semester_or_404(semester_id)
        self._ensure_kelas_semester_same_tahun(kelas, semester)

        if current_user.user_type == UserType.admin:
            return kelas, semester

        if current_user.user_type != UserType.guru:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin/guru can access this endpoint",
            )

        is_wali_kelas = kelas.wali_kelas_id == current_user.user_id
        is_assigned = await self._is_guru_assigned_to_kelas_tahun(
            current_user.user_id,
            kelas.kelas_id,
            semester.tahun_ajaran_id,
        )

        if not is_wali_kelas and not is_assigned:
            published_by_me = await self.db.execute(
                select(func.count())
                .select_from(Rapor)
                .where(
                    and_(
                        Rapor.kelas_id == kelas.kelas_id,
                        Rapor.semester_id == semester.semester_id,
                        Rapor.published_by == current_user.user_id,
                    )
                )
            )
            if int(published_by_me.scalar() or 0) <= 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Guru tidak memiliki akses ke rapor pada kelas/semester ini",
                )

        return kelas, semester

    async def _check_wali_kelas(self, kelas_id: UUID, current_user: User) -> Kelas:
        kelas = await self._get_kelas_or_404(kelas_id)
        if current_user.user_type == UserType.guru and kelas.wali_kelas_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only wali kelas of this class or admin can perform this action",
            )
        return kelas

    async def _check_rapor_view_access(self, rapor: Rapor, current_user: User) -> None:
        await self._resolve_rapor_access_context(
            rapor.kelas_id,
            rapor.semester_id,
            current_user,
        )

    async def _check_rapor_edit_access(self, rapor: Rapor, current_user: User) -> None:
        await self._check_rapor_view_access(rapor, current_user)

    # â”€â”€ Grade calculation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    # â”€â”€ Attendance summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    # â”€â”€ DTO converters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def _nilai_to_dto(
        self,
        rn: RaporNilai,
        mapel_nama: str,
        komponen_nilai: list[RaporKomponenNilaiDTO] | None = None,
        rincian_tugas: list[RaporTugasNilaiDTO] | None = None,
    ) -> RaporNilaiResponseDTO:
        return RaporNilaiResponseDTO(
            rapor_nilai_id=rn.rapor_nilai_id,
            rapor_id=rn.rapor_id,
            mapel_id=rn.mapel_id,
            mapel_nama=mapel_nama,
            nilai_akhir=float(rn.nilai_akhir),
            nilai_sumber=float(rn.nilai_sumber),
            nilai_override=float(rn.nilai_override) if rn.nilai_override is not None else None,
            is_manual_override=rn.is_manual_override,
            catatan=rn.catatan,
            komponen_nilai=komponen_nilai or [],
            rincian_tugas=rincian_tugas or [],
        )

    async def _get_components_for_student(
        self, user_id: UUID, kelas_id: UUID, semester_id: UUID
    ) -> dict[UUID, list[RaporKomponenNilaiDTO]]:
        result = await self.db.execute(
            select(
                Tugas.mapel_id,
                Tugas.jenis,
                func.avg(Nilai.nilai).label("avg_nilai"),
                func.count(Nilai.nilai).label("cnt"),
            )
            .join(
                Nilai,
                and_(
                    Nilai.tugas_id == Tugas.tugas_id,
                    Nilai.user_id == user_id,
                ),
            )
            .where(
                and_(
                    Tugas.kelas_id == kelas_id,
                    Tugas.semester_id == semester_id,
                )
            )
            .group_by(Tugas.mapel_id, Tugas.jenis)
        )

        grouped: dict[UUID, list[RaporKomponenNilaiDTO]] = defaultdict(list)
        for mapel_id, jenis, avg_nilai, cnt in result.all():
            grouped[mapel_id].append(
                RaporKomponenNilaiDTO(
                    jenis_tugas=jenis.value if isinstance(jenis, JenisTugas) else str(jenis),
                    nilai_rata=round(float(avg_nilai or 0), 2),
                    jumlah_tugas=int(cnt or 0),
                )
            )
        return grouped

    async def _get_task_details_for_student(
        self, user_id: UUID, kelas_id: UUID, semester_id: UUID
    ) -> dict[UUID, list[RaporTugasNilaiDTO]]:
        result = await self.db.execute(
            select(
                Tugas.mapel_id,
                Tugas.tugas_id,
                Tugas.judul,
                Tugas.jenis,
                Nilai.nilai,
            )
            .outerjoin(
                Nilai,
                and_(
                    Nilai.tugas_id == Tugas.tugas_id,
                    Nilai.user_id == user_id,
                ),
            )
            .where(
                and_(
                    Tugas.kelas_id == kelas_id,
                    Tugas.semester_id == semester_id,
                )
            )
            .order_by(Tugas.created_at.desc())
        )

        grouped: dict[UUID, list[RaporTugasNilaiDTO]] = defaultdict(list)
        for mapel_id, tugas_id, judul, jenis, nilai in result.all():
            grouped[mapel_id].append(
                RaporTugasNilaiDTO(
                    tugas_id=tugas_id,
                    judul_tugas=judul,
                    jenis_tugas=jenis.value if isinstance(jenis, JenisTugas) else str(jenis),
                    nilai=float(nilai) if nilai is not None else None,
                )
            )
        return grouped

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
        components_by_mapel = await self._get_components_for_student(
            rapor.user_id, rapor.kelas_id, rapor.semester_id
        )
        task_details_by_mapel = await self._get_task_details_for_student(
            rapor.user_id, rapor.kelas_id, rapor.semester_id
        )

        grades = [
            self._nilai_to_dto(
                rn,
                rn.mapel.nama_mapel,
                components_by_mapel.get(rn.mapel_id, []),
                task_details_by_mapel.get(rn.mapel_id, []),
            )
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

    # â”€â”€ Generate rapor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                        nilai_sumber=grade,
                        nilai_override=None,
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

    # â”€â”€ List rapor by kelas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async def list_rapor_by_kelas(
        self, kelas_id: UUID, semester_id: UUID, current_user: User
    ) -> list[RaporListItemDTO]:
        """
        List all rapor for a class in a semester.

        Raises:
            HTTPException: 404 if kelas/semester not found
            HTTPException: 403 if not authorized
        """
        await self._resolve_rapor_access_context(kelas_id, semester_id, current_user)

        result = await self.db.execute(
            select(
                User.user_id,
                User.username,
                SiswaProfile.nama_lengkap,
                Rapor.rapor_id,
                Rapor.is_published,
                Rapor.published_at,
                Rapor.created_at,
            )
            .join(SiswaKelas, SiswaKelas.user_id == User.user_id)
            .outerjoin(SiswaProfile, SiswaProfile.user_id == User.user_id)
            .outerjoin(
                Rapor,
                and_(
                    Rapor.user_id == User.user_id,
                    Rapor.semester_id == semester_id,
                    Rapor.kelas_id == kelas_id,
                ),
            )
            .where(SiswaKelas.kelas_id == kelas_id)
            .order_by(
                SiswaProfile.nama_lengkap,
                User.username,
                Rapor.created_at.desc().nulls_last(),
            )
        )

        items = []
        seen_user_ids: set[UUID] = set()
        for row in result.all():
            user_id = row[0]
            if user_id in seen_user_ids:
                continue
            seen_user_ids.add(user_id)
            username = row[1]
            nama_lengkap = row[2] or username
            rapor_id = row[3]
            is_published = bool(row[4]) if row[4] is not None else False
            published_at = row[5]
            items.append(RaporListItemDTO(
                rapor_id=rapor_id,
                user_id=user_id,
                username=username,
                nama_lengkap=nama_lengkap,
                is_published=is_published,
                published_at=published_at,
            ))

        return items

    async def get_guru_rapor_context(
        self,
        current_user: User,
    ) -> GuruRaporContextResponseDTO:
        if current_user.user_type == UserType.admin:
            ta_rows = (
                await self.db.execute(select(TahunAjaran).order_by(TahunAjaran.tanggal_mulai.desc()))
            ).scalars().all()
            sem_rows = (
                await self.db.execute(select(Semester).order_by(Semester.tanggal_mulai.desc()))
            ).scalars().all()
            kelas_rows = (await self.db.execute(select(Kelas).order_by(Kelas.nama_kelas.asc()))).scalars().all()
            return GuruRaporContextResponseDTO(
                tahun_ajaran=[
                    GuruRaporContextTahunAjaranDTO(
                        tahun_ajaran_id=ta.tahun_ajaran_id,
                        nama=ta.nama,
                        is_active=ta.is_active,
                    )
                    for ta in ta_rows
                ],
                semesters=[
                    GuruRaporContextSemesterDTO(
                        semester_id=sem.semester_id,
                        tahun_ajaran_id=sem.tahun_ajaran_id,
                        tipe=sem.tipe.value if hasattr(sem.tipe, "value") else str(sem.tipe),
                        is_active=sem.is_active,
                    )
                    for sem in sem_rows
                ],
                kelas=[
                    GuruRaporContextKelasDTO(
                        kelas_id=kelas.kelas_id,
                        tahun_ajaran_id=kelas.tahun_ajaran_id,
                        nama_kelas=kelas.nama_kelas,
                        wali_kelas_id=kelas.wali_kelas_id,
                    )
                    for kelas in kelas_rows
                ],
            )

        if current_user.user_type != UserType.guru:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin/guru can access this endpoint",
            )

        wali_rows = (
            await self.db.execute(select(Kelas.kelas_id).where(Kelas.wali_kelas_id == current_user.user_id))
        ).scalars().all()
        mapel_rows = (
            await self.db.execute(
                select(distinct(GuruMapel.kelas_id)).where(GuruMapel.user_id == current_user.user_id)
            )
        ).scalars().all()
        kelas_ids = {row for row in wali_rows} | {row for row in mapel_rows}

        if not kelas_ids:
            return GuruRaporContextResponseDTO()

        kelas_rows = (
            await self.db.execute(select(Kelas).where(Kelas.kelas_id.in_(kelas_ids)).order_by(Kelas.nama_kelas.asc()))
        ).scalars().all()
        tahun_ajaran_ids = {kelas.tahun_ajaran_id for kelas in kelas_rows}

        ta_rows = (
            await self.db.execute(
                select(TahunAjaran)
                .where(TahunAjaran.tahun_ajaran_id.in_(tahun_ajaran_ids))
                .order_by(TahunAjaran.tanggal_mulai.desc())
            )
        ).scalars().all()
        sem_rows = (
            await self.db.execute(
                select(Semester)
                .where(Semester.tahun_ajaran_id.in_(tahun_ajaran_ids))
                .order_by(Semester.tanggal_mulai.desc())
            )
        ).scalars().all()

        return GuruRaporContextResponseDTO(
            tahun_ajaran=[
                GuruRaporContextTahunAjaranDTO(
                    tahun_ajaran_id=ta.tahun_ajaran_id,
                    nama=ta.nama,
                    is_active=ta.is_active,
                )
                for ta in ta_rows
            ],
            semesters=[
                GuruRaporContextSemesterDTO(
                    semester_id=sem.semester_id,
                    tahun_ajaran_id=sem.tahun_ajaran_id,
                    tipe=sem.tipe.value if hasattr(sem.tipe, "value") else str(sem.tipe),
                    is_active=sem.is_active,
                )
                for sem in sem_rows
            ],
            kelas=[
                GuruRaporContextKelasDTO(
                    kelas_id=kelas.kelas_id,
                    tahun_ajaran_id=kelas.tahun_ajaran_id,
                    nama_kelas=kelas.nama_kelas,
                    wali_kelas_id=kelas.wali_kelas_id,
                )
                for kelas in kelas_rows
            ],
        )

    async def _compose_rapor_editor_dto(
        self,
        rapor: Rapor,
    ) -> RaporEditorResponseDTO:
        result = await self.db.execute(
            select(RaporNilai)
            .options(selectinload(RaporNilai.mapel))
            .where(RaporNilai.rapor_id == rapor.rapor_id)
            .order_by(RaporNilai.mapel_id)
        )
        nilai_entries = result.scalars().all()
        components_by_mapel = await self._get_components_for_student(
            rapor.user_id, rapor.kelas_id, rapor.semester_id
        )
        task_details_by_mapel = await self._get_task_details_for_student(
            rapor.user_id, rapor.kelas_id, rapor.semester_id
        )
        grades = [
            self._nilai_to_dto(
                rn,
                rn.mapel.nama_mapel,
                components_by_mapel.get(rn.mapel_id, []),
                task_details_by_mapel.get(rn.mapel_id, []),
            )
            for rn in nilai_entries
        ]

        student_row = await self.db.execute(
            select(User.username, SiswaProfile.nama_lengkap)
            .join(SiswaProfile, SiswaProfile.user_id == User.user_id, isouter=True)
            .where(User.user_id == rapor.user_id)
        )
        student_meta = student_row.first()
        username = student_meta[0] if student_meta else "-"
        nama_lengkap = (student_meta[1] if student_meta else None) or username

        attendance = await self._get_attendance_summary(rapor.user_id, rapor.semester_id)

        return RaporEditorResponseDTO(
            rapor_id=rapor.rapor_id,
            user_id=rapor.user_id,
            username=username,
            nama_lengkap=nama_lengkap,
            semester_id=rapor.semester_id,
            kelas_id=rapor.kelas_id,
            catatan_wali_kelas=rapor.catatan_wali_kelas,
            is_published=rapor.is_published,
            published_at=rapor.published_at,
            grades=grades,
            attendance_summary=attendance,
        )

    async def _get_or_create_rapor_for_editor(
        self, user_id: UUID, kelas_id: UUID, semester_id: UUID
    ) -> Rapor:
        existing = await self.db.execute(
            select(Rapor).where(
                and_(
                    Rapor.user_id == user_id,
                    Rapor.semester_id == semester_id,
                )
            )
        )
        rapor = existing.scalar_one_or_none()
        if rapor:
            if rapor.kelas_id != kelas_id:
                rapor.kelas_id = kelas_id
            return rapor

        rapor = Rapor(user_id=user_id, semester_id=semester_id, kelas_id=kelas_id)
        self.db.add(rapor)
        await self.db.flush()
        return rapor

    async def get_rapor_editor(
        self,
        kelas_id: UUID,
        semester_id: UUID,
        siswa_id: UUID,
        current_user: User,
    ) -> RaporEditorResponseDTO:
        try:
            kelas, semester = await self._resolve_rapor_access_context(
                kelas_id,
                semester_id,
                current_user,
            )

            student_in_class = await self.db.execute(
                select(SiswaKelas).where(
                    and_(
                        SiswaKelas.kelas_id == kelas_id,
                        SiswaKelas.user_id == siswa_id,
                    )
                )
            )
            if not student_in_class.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Siswa tidak terdaftar di kelas ini",
                )

            rapor = await self._get_or_create_rapor_for_editor(siswa_id, kelas_id, semester_id)

            mapel_result = await self.db.execute(
                select(distinct(GuruMapel.mapel_id)).where(
                    and_(
                        GuruMapel.kelas_id == kelas_id,
                        GuruMapel.tahun_ajaran_id == kelas.tahun_ajaran_id,
                        GuruMapel.tahun_ajaran_id == semester.tahun_ajaran_id,
                    )
                )
            )
            mapel_ids = [row for row in mapel_result.scalars().all()]
            if not mapel_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Belum ada penugasan guru-mapel di kelas ini",
                )

            existing_result = await self.db.execute(
                select(RaporNilai).where(RaporNilai.rapor_id == rapor.rapor_id)
            )
            existing_by_mapel = {rn.mapel_id: rn for rn in existing_result.scalars().all()}

            for mapel_id in mapel_ids:
                source_grade = await self._calculate_grade(
                    siswa_id, mapel_id, kelas_id, semester_id
                )
                rn = existing_by_mapel.get(mapel_id)
                if rn:
                    rn.nilai_sumber = source_grade
                    if rn.nilai_override is not None:
                        rn.nilai_akhir = float(rn.nilai_override)
                        rn.is_manual_override = True
                    else:
                        rn.nilai_akhir = source_grade
                        rn.is_manual_override = False
                else:
                    self.db.add(
                        RaporNilai(
                            rapor_id=rapor.rapor_id,
                            mapel_id=mapel_id,
                            nilai_sumber=source_grade,
                            nilai_override=None,
                            nilai_akhir=source_grade,
                            is_manual_override=False,
                            catatan=None,
                        )
                    )

            await self.db.commit()
            await self.db.refresh(rapor)
            return await self._compose_rapor_editor_dto(rapor)
        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to build rapor editor: {str(e)}",
            )

    async def save_rapor_editor(
        self,
        rapor_id: UUID,
        request: SaveRaporEditorDTO,
        current_user: User,
    ) -> RaporEditorResponseDTO:
        try:
            result = await self.db.execute(select(Rapor).where(Rapor.rapor_id == rapor_id))
            rapor = result.scalar_one_or_none()
            if not rapor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Rapor with ID {rapor_id} not found",
                )
            await self._check_rapor_edit_access(rapor, current_user)

            if request.catatan_wali_kelas is not None:
                cleaned_catatan_wali = request.catatan_wali_kelas.strip()
                rapor.catatan_wali_kelas = cleaned_catatan_wali or None

            rn_result = await self.db.execute(
                select(RaporNilai).where(RaporNilai.rapor_id == rapor.rapor_id)
            )
            rows = rn_result.scalars().all()
            by_id = {rn.rapor_nilai_id: rn for rn in rows}
            by_mapel = {rn.mapel_id: rn for rn in rows}

            for entry in request.entries:
                rn = None
                if entry.rapor_nilai_id is not None:
                    rn = by_id.get(entry.rapor_nilai_id)
                if rn is None:
                    rn = by_mapel.get(entry.mapel_id)
                if rn is None:
                    continue

                if entry.nilai_override is None:
                    rn.nilai_override = None
                    rn.nilai_akhir = float(rn.nilai_sumber)
                    rn.is_manual_override = False
                else:
                    rn.nilai_override = entry.nilai_override
                    rn.nilai_akhir = entry.nilai_override
                    rn.is_manual_override = True
                if entry.catatan is None:
                    rn.catatan = None
                else:
                    cleaned_catatan = entry.catatan.strip()
                    rn.catatan = cleaned_catatan or None

            # Keep publication status stable while editing.
            # Unpublish should be an explicit action, not side-effect of save.

            await self.db.commit()
            await self.db.refresh(rapor)
            return await self._compose_rapor_editor_dto(rapor)
        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save rapor editor: {str(e)}",
            )

    # â”€â”€ Get single rapor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

        await self._check_rapor_view_access(rapor, current_user)
        return await self._rapor_to_full_dto(rapor)

    # â”€â”€ Update rapor (catatan wali kelas) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

            await self._check_rapor_edit_access(rapor, current_user)

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

    # â”€â”€ Override nilai â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

            await self._check_rapor_edit_access(rapor, current_user)

            rapor_nilai.nilai_override = request.nilai_akhir
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

    # â”€â”€ Recalculate rapor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

            await self._check_rapor_edit_access(rapor, current_user)

            # Get existing rapor_nilai entries
            nilai_result = await self.db.execute(
                select(RaporNilai).where(RaporNilai.rapor_id == rapor_id)
            )
            nilai_entries = nilai_result.scalars().all()

            for rn in nilai_entries:
                grade = await self._calculate_grade(
                    rapor.user_id, rn.mapel_id, rapor.kelas_id, rapor.semester_id
                )
                rn.nilai_sumber = grade
                if rn.nilai_override is not None:
                    rn.nilai_akhir = float(rn.nilai_override)
                    rn.is_manual_override = True
                else:
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

    # â”€â”€ Publish single rapor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

            await self._check_rapor_edit_access(rapor, current_user)

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

    async def unpublish_rapor(
        self, rapor_id: UUID, current_user: User
    ) -> RaporResponseDTO:
        try:
            result = await self.db.execute(
                select(Rapor).where(Rapor.rapor_id == rapor_id)
            )
            rapor = result.scalar_one_or_none()
            if not rapor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Rapor with ID {rapor_id} not found",
                )

            await self._check_rapor_edit_access(rapor, current_user)

            rapor.is_published = False
            rapor.published_at = None
            rapor.published_by = None

            await self.db.commit()
            await self.db.refresh(rapor)

            return await self._rapor_to_full_dto(rapor)
        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to unpublish rapor: {str(e)}",
            )

    # â”€â”€ Publish all rapor for a kelas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


    async def get_my_rapor(
        self, semester_id: UUID | None, semester_ke: int | None, current_user: User
    ) -> RaporResponseDTO:
        """
        Get own published rapor for a semester (student view).

        Raises:
            HTTPException: 404 if no published rapor found
        """
        timeline_rows = await self.student_semester_repo.list_student_semester_rows(
            current_user.user_id
        )
        if not timeline_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Belum ada timeline semester untuk siswa ini",
            )

        expected_slots = [
            (1, TingkatKelas.x, TipeSemester.ganjil),
            (2, TingkatKelas.x, TipeSemester.genap),
            (3, TingkatKelas.xi, TipeSemester.ganjil),
            (4, TingkatKelas.xi, TipeSemester.genap),
            (5, TingkatKelas.xii, TipeSemester.ganjil),
            (6, TingkatKelas.xii, TipeSemester.genap),
        ]
        latest_by_semester_ke: dict[int, UUID] = {}
        for tingkat, tipe, row_semester_id, *_ in timeline_rows:
            if tingkat is None or tipe is None or row_semester_id is None:
                continue
            mapped_ke = next(
                (
                    slot_ke
                    for slot_ke, slot_tingkat, slot_tipe in expected_slots
                    if slot_tingkat == tingkat and slot_tipe == tipe
                ),
                None,
            )
            if mapped_ke is None or mapped_ke in latest_by_semester_ke:
                continue
            latest_by_semester_ke[mapped_ke] = row_semester_id

        if semester_ke is not None:
            resolved_by_ke = latest_by_semester_ke.get(semester_ke)
            if resolved_by_ke is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Semester ke-{semester_ke} tidak tersedia pada timeline siswa ini",
                )
            if semester_id is not None and semester_id != resolved_by_ke:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="semester_id tidak cocok dengan semester_ke yang dipilih",
                )
            semester_id = resolved_by_ke

        if semester_id is None:
            semester_id = timeline_rows[0][2]

        is_allowed = await self.student_semester_repo.is_student_allowed_semester(
            current_user.user_id, semester_id
        )
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Semester tidak valid untuk timeline siswa ini",
            )

        kelas_id = await self.student_semester_repo.get_primary_kelas_for_semester(
            current_user.user_id, semester_id
        )
        if not kelas_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kelas siswa untuk semester ini tidak ditemukan",
            )

        result = await self.db.execute(
            select(Rapor).where(
                and_(
                    Rapor.user_id == current_user.user_id,
                    Rapor.semester_id == semester_id,
                    Rapor.kelas_id == kelas_id,
                )
            ).order_by(Rapor.created_at.desc())
        )
        rapor_rows = list(result.scalars().all())
        if not rapor_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No rapor found for this semester"
            )

        rapor = next((row for row in rapor_rows if row.is_published), None)
        if rapor is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Your rapor for this semester has not been published yet"
            )

        return await self._rapor_to_full_dto(rapor)
