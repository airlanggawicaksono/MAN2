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
