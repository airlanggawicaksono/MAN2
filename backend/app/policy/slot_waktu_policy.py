from fastapi import HTTPException, status


class SlotWaktuPolicy:
    @staticmethod
    def ensure_exists(slot) -> None:
        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time slot not found",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_time_range_valid(jam_mulai, jam_selesai) -> None:
        if jam_selesai <= jam_mulai:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Jam selesai harus lebih besar dari jam mulai",
            )
