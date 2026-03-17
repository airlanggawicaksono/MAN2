from fastapi import HTTPException, status


class TahunAjaranPolicy:
    @staticmethod
    def ensure_nama_available(is_taken: bool, nama: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Academic year '{nama}' already exists",
            )

    @staticmethod
    def ensure_exists(tahun_ajaran) -> None:
        if not tahun_ajaran:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic year not found",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
