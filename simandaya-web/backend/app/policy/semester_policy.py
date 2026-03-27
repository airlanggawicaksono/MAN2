from fastapi import HTTPException, status


class SemesterPolicy:
    @staticmethod
    def ensure_tahun_ajaran_exists(tahun_ajaran, tahun_ajaran_id) -> None:
        if not tahun_ajaran:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Academic year with ID '{tahun_ajaran_id}' does not exist",
            )

    @staticmethod
    def ensure_unique_for_tahun_ajaran(existing_semester, tipe) -> None:
        if existing_semester:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Semester {tipe.value} already exists for this academic year",
            )

    @staticmethod
    def ensure_exists(semester) -> None:
        if not semester:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Semester not found",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_date_range_valid(tanggal_mulai, tanggal_selesai) -> None:
        if tanggal_selesai <= tanggal_mulai:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tanggal selesai semester harus lebih besar dari tanggal mulai",
            )

    @staticmethod
    def ensure_within_tahun_ajaran(tahun_ajaran, tanggal_mulai, tanggal_selesai) -> None:
        if tanggal_mulai < tahun_ajaran.tanggal_mulai or tanggal_selesai > tahun_ajaran.tanggal_selesai:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rentang semester harus berada di dalam rentang tahun ajaran",
            )

    @staticmethod
    def ensure_not_overlapping(existing_semesters: list, tanggal_mulai, tanggal_selesai, exclude_id=None) -> None:
        for row in existing_semesters:
            if exclude_id is not None and row.semester_id == exclude_id:
                continue
            overlaps = tanggal_mulai <= row.tanggal_selesai and tanggal_selesai >= row.tanggal_mulai
            if overlaps:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Rentang semester bertabrakan dengan semester '{row.tipe.value}'",
                )
