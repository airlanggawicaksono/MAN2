from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.penilaian.siswa_overview_dto import (
    SiswaOverviewMapelDTO,
    SiswaOverviewResponseDTO,
    SiswaOverviewTaskDetailDTO,
    SiswaOverviewTugasItemDTO,
)
from app.enums import TingkatKelas, TipeSemester
from app.models.user import User
from app.repositoriy.student_semester_repository import StudentSemesterRepository
from app.services.rapor_service import RaporService
from app.services.tugas_service import TugasService


class SiswaOverviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.student_semester_repo = StudentSemesterRepository(db)
        self.rapor_service = RaporService(db)
        self.tugas_service = TugasService(db)

    async def _resolve_student_semester_context(
        self,
        current_user: User,
        semester_id: UUID | None,
        semester_ke: int | None,
    ) -> tuple[UUID, int | None, UUID]:
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
            active_semester_id = await self.student_semester_repo.find_active_semester_for_student(
                current_user.user_id
            )
            semester_id = active_semester_id or timeline_rows[0][2]

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

        resolved_ke = semester_ke
        if resolved_ke is None:
            for slot_ke, slot_semester_id in latest_by_semester_ke.items():
                if slot_semester_id == semester_id:
                    resolved_ke = slot_ke
                    break

        return semester_id, resolved_ke, kelas_id

    async def get_my_overview(
        self,
        current_user: User,
        semester_id: UUID | None,
        semester_ke: int | None,
    ) -> SiswaOverviewResponseDTO:
        resolved_semester_id, resolved_semester_ke, kelas_id = (
            await self._resolve_student_semester_context(
                current_user=current_user,
                semester_id=semester_id,
                semester_ke=semester_ke,
            )
        )

        tugas_list = await self.tugas_service.list_tugas_my_class(
            current_user=current_user,
            semester_id=resolved_semester_id,
        )
        submissions = await self.tugas_service.list_my_submissions(
            semester_id=resolved_semester_id,
            current_user=current_user,
        )
        submission_by_tugas_id = {submission.tugas_id: submission for submission in submissions}

        overview_tugas: list[SiswaOverviewTugasItemDTO] = []
        for tugas in tugas_list:
            submission = submission_by_tugas_id.get(tugas.tugas_id)
            overview_tugas.append(
                SiswaOverviewTugasItemDTO(
                    tugas_id=tugas.tugas_id,
                    semester_id=tugas.semester_id,
                    kelas_id=tugas.kelas_id,
                    mapel_id=tugas.mapel_id,
                    mapel_nama=tugas.mapel_nama,
                    guru_pengajar=tugas.guru_pengajar,
                    jenis=tugas.jenis.value if hasattr(tugas.jenis, "value") else str(tugas.jenis),
                    judul=tugas.judul,
                    deskripsi=tugas.deskripsi,
                    deadline=tugas.deadline,
                    created_at=tugas.created_at,
                    link_tugas=tugas.link_tugas,
                    link_submission=tugas.link_submission,
                    is_submitted=submission is not None,
                    submitted_at=submission.submitted_at if submission else None,
                    is_late_submission=submission.is_late if submission else False,
                )
            )

        rapor = None
        try:
            rapor = await self.rapor_service.get_my_rapor(
                semester_id=resolved_semester_id,
                semester_ke=resolved_semester_ke,
                current_user=current_user,
            )
        except HTTPException as e:
            if e.status_code != status.HTTP_404_NOT_FOUND:
                raise

        nilai_mapel: list[SiswaOverviewMapelDTO] = []
        if rapor:
            tugas_by_id = {tugas.tugas_id: tugas for tugas in tugas_list}
            visible_tugas_ids = set(tugas_by_id.keys())

            for grade in rapor.grades:
                task_details: list[SiswaOverviewTaskDetailDTO] = []
                for task in grade.rincian_tugas:
                    if task.tugas_id not in visible_tugas_ids:
                        continue
                    tugas_meta = tugas_by_id[task.tugas_id]
                    show_nilai = tugas_meta.is_nilai_published_to_students
                    task_details.append(
                        SiswaOverviewTaskDetailDTO(
                            tugas_id=task.tugas_id,
                            judul_tugas=task.judul_tugas,
                            jenis_tugas=task.jenis_tugas,
                            nilai=task.nilai if show_nilai else None,
                            nilai_disembunyikan=not show_nilai,
                            catatan=None,
                            deadline=tugas_meta.deadline,
                            link_tugas=tugas_meta.link_tugas,
                            link_submission=tugas_meta.link_submission,
                        )
                    )

                nilai_mapel.append(
                    SiswaOverviewMapelDTO(
                        mapel_id=grade.mapel_id,
                        mapel_nama=grade.mapel_nama,
                        nilai_akhir=grade.nilai_akhir,
                        nilai_sumber=grade.nilai_sumber,
                        nilai_override=grade.nilai_override,
                        is_manual_override=grade.is_manual_override,
                        catatan=grade.catatan,
                        komponen_nilai=[
                            {
                                "jenis_tugas": komponen.jenis_tugas,
                                "nilai_rata": komponen.nilai_rata,
                                "jumlah_tugas": komponen.jumlah_tugas,
                            }
                            for komponen in grade.komponen_nilai
                        ],
                        tugas_details=task_details,
                    )
                )

        return SiswaOverviewResponseDTO(
            semester_id=resolved_semester_id,
            semester_ke=resolved_semester_ke,
            kelas_id=kelas_id,
            rapor_published=rapor is not None,
            rapor=rapor,
            nilai_mapel=nilai_mapel,
            tugas_list=overview_tugas,
        )
