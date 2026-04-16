from fastapi import HTTPException, status


class MapelPolicy:
    @staticmethod
    def ensure_kode_available(is_taken: bool, kode_mapel: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject code '{kode_mapel}' already exists",
            )

    @staticmethod
    def ensure_exists(mapel) -> None:
        if not mapel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found",
            )

    @staticmethod
    def ensure_active(mapel) -> None:
        if not mapel.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject '{mapel.nama_mapel}' is archived",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
