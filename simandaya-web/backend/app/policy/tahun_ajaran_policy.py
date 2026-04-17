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

    @staticmethod
    def ensure_date_range_valid(tanggal_mulai, tanggal_selesai) -> None:
        if tanggal_selesai <= tanggal_mulai:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tanggal selesai harus lebih besar dari tanggal mulai",
            )

    @staticmethod
    def ensure_not_overlapping(
        existing_tahun_ajaran: list,
        tanggal_mulai,
        tanggal_selesai,
        exclude_id=None,
    ) -> None:
        for row in existing_tahun_ajaran:
            if exclude_id is not None and row.tahun_ajaran_id == exclude_id:
                continue
            overlaps = tanggal_mulai <= row.tanggal_selesai and tanggal_selesai >= row.tanggal_mulai
            if overlaps:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Rentang tanggal bertabrakan dengan tahun ajaran '{row.nama}'",
                )
