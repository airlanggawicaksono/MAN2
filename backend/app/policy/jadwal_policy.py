from fastapi import HTTPException, status

from app.enums import UserType


class JadwalPolicy:
    @staticmethod
    def ensure_user_exists(user, user_id) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )

    @staticmethod
    def ensure_user_is_guru(user, user_id) -> None:
        if user.user_type != UserType.guru:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user_id} is not a guru",
            )

    @staticmethod
    def ensure_entity_exists(entity, label: str, entity_id) -> None:
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{label} with ID {entity_id} not found",
            )

    @staticmethod
    def ensure_mapel_active(mapel) -> None:
        if not mapel.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mata pelajaran '{mapel.nama_mapel}' sedang diarsipkan",
            )

    @staticmethod
    def ensure_mapel_in_tahun_ajaran(mapel, tahun_ajaran_id) -> None:
        if mapel.tahun_ajaran_id != tahun_ajaran_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mata pelajaran harus berasal dari tahun ajaran yang sama",
            )

    @staticmethod
    def ensure_kelas_in_tahun_ajaran(kelas, tahun_ajaran_id) -> None:
        if kelas.tahun_ajaran_id != tahun_ajaran_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kelas harus berasal dari tahun ajaran yang sama",
            )

    @staticmethod
    def ensure_kelas_active(kelas) -> None:
        if not kelas.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kelas '{kelas.nama_kelas}' sedang diarsipkan",
            )

    @staticmethod
    def ensure_guru_mapel_unique(existing_assignment) -> None:
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This guru-mapel-kelas-tahun assignment already exists",
            )

    @staticmethod
    def ensure_single_active_guru_for_mapel_kelas_tahun(existing_assignment, user_id) -> None:
        if existing_assignment and existing_assignment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Mapel ini sudah ditugaskan ke guru lain pada kelas/tahun ajaran yang sama. "
                    "Gunakan edit penugasan untuk transfer guru."
                ),
            )

    @staticmethod
    def ensure_guru_mapel_exists(guru_mapel, guru_mapel_id) -> None:
        if not guru_mapel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GuruMapel with ID {guru_mapel_id} not found",
            )

    @staticmethod
    def ensure_guru_mapel_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_class_slot_available(clash) -> None:
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class already has a lesson at this time slot",
            )

    @staticmethod
    def ensure_teacher_slot_available(clash) -> None:
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher already has a lesson at this time slot",
            )

    @staticmethod
    def ensure_class_time_available(clash) -> None:
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Jadwal kelas bertabrakan dengan jam pelajaran lain",
            )

    @staticmethod
    def ensure_teacher_time_available(clash) -> None:
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Jadwal guru bertabrakan dengan kelas lain pada jam tersebut",
            )

    @staticmethod
    def ensure_teacher_transfer_available(clash) -> None:
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Transfer penugasan gagal: guru tujuan sudah punya jadwal di slot yang sama. "
                    "Ubah jadwal bentrok terlebih dahulu."
                ),
            )

    @staticmethod
    def ensure_jadwal_exists(jadwal, jadwal_id) -> None:
        if not jadwal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Jadwal with ID {jadwal_id} not found",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_student_has_kelas(kelas_id) -> None:
        if not kelas_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student is not assigned to any class",
            )
