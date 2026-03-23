from fastapi import HTTPException, status

from app.enums import UserType


class KelasPolicy:
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
    def ensure_tahun_ajaran_exists(tahun_ajaran, tahun_ajaran_id) -> None:
        if not tahun_ajaran:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tahun ajaran with ID {tahun_ajaran_id} not found",
            )

    @staticmethod
    def ensure_user_exists(user, user_id) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )

    @staticmethod
    def ensure_user_is_guru(user) -> None:
        if user.user_type != UserType.guru:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user.username} is not a guru (current type: {user.user_type.value})",
            )

    @staticmethod
    def ensure_wali_kelas_available(existing_kelas, username: str) -> None:
        if not existing_kelas:
            return
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Guru {username} sudah menjadi wali kelas untuk "
                f"{existing_kelas.nama_kelas} pada tahun ajaran yang sama."
            ),
        )

    @staticmethod
    def ensure_user_is_siswa(user) -> None:
        if user.user_type != UserType.siswa:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user.username} is not a siswa (current type: {user.user_type.value})",
            )

    @staticmethod
    def ensure_kelas_name_available(existing_kelas, nama_kelas: str, tahun_ajaran_nama: str) -> None:
        if existing_kelas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kelas '{nama_kelas}' already exists in tahun ajaran {tahun_ajaran_nama}",
            )

    @staticmethod
    def ensure_kelas_exists(kelas, kelas_id) -> None:
        if not kelas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas with ID {kelas_id} not found",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_siswa_not_already_assigned(existing_assignment, username: str, kelas_nama: str) -> None:
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Siswa {username} is already assigned to kelas {kelas_nama}",
            )

    @staticmethod
    def ensure_siswa_not_already_assigned_in_same_tahun(
        existing_assignment, username: str, target_kelas_nama: str
    ) -> None:
        if not existing_assignment:
            return

        assigned_kelas_nama = (
            existing_assignment.kelas.nama_kelas
            if getattr(existing_assignment, "kelas", None)
            else "kelas lain"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Siswa {username} sudah terdaftar di kelas {assigned_kelas_nama} "
                f"pada tahun ajaran yang sama. Hapus dulu dari kelas lama sebelum "
                f"memasukkan ke {target_kelas_nama}."
            ),
        )

    @staticmethod
    def ensure_kelas_capacity(current_count: int, kapasitas: int, kelas_nama: str) -> None:
        if current_count >= kapasitas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kelas {kelas_nama} has reached maximum capacity ({kapasitas})",
            )

    @staticmethod
    def ensure_siswa_assignment_exists(assignment, kelas_id, user_id) -> None:
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Siswa assignment not found for kelas_id {kelas_id} and user_id {user_id}",
            )

    @staticmethod
    def ensure_target_classes_exist(new_classes) -> None:
        if not new_classes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target academic year has no classes. Create classes first.",
            )

    @staticmethod
    def ensure_student_has_kelas(kelas) -> None:
        if not kelas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student is not assigned to any class",
            )
