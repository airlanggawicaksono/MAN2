from fastapi import HTTPException, status


class KurikulumPolicy:
    @staticmethod
    def ensure_kategori_exists(kategori, kategori_kelas_id) -> None:
        if not kategori:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kategori kelas with ID {kategori_kelas_id} not found",
            )

    @staticmethod
    def ensure_kategori_active(kategori) -> None:
        if not kategori.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kategori kelas '{kategori.nama}' is inactive",
            )

    @staticmethod
    def ensure_mapel_exists(mapel, mapel_id) -> None:
        if not mapel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Subject with ID {mapel_id} not found",
            )

    @staticmethod
    def ensure_tahun_ajaran_exists(tahun_ajaran, tahun_ajaran_id) -> None:
        if not tahun_ajaran:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Academic year with ID {tahun_ajaran_id} not found",
            )

    @staticmethod
    def ensure_assignment_unique(existing, mapel_nama: str, tingkat: str) -> None:
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Subject '{mapel_nama}' is already assigned to grade {tingkat} "
                    "for this academic year"
                ),
            )

    @staticmethod
    def ensure_kurikulum_mapel_exists(km, kurikulum_mapel_id) -> None:
        if not km:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Curriculum-subject assignment with ID {kurikulum_mapel_id} not found",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
