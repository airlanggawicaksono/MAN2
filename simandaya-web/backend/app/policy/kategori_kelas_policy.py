from fastapi import HTTPException, status


class KategoriKelasPolicy:
    @staticmethod
    def ensure_exists(kategori, kategori_kelas_id) -> None:
        if not kategori:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kategori kelas with ID {kategori_kelas_id} not found",
            )

    @staticmethod
    def ensure_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_kode_available(existing, kode: str) -> None:
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kategori kelas kode '{kode}' already exists",
            )

    @staticmethod
    def ensure_nama_available(existing, nama: str) -> None:
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kategori kelas nama '{nama}' already exists",
            )
