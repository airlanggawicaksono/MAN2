from datetime import date, datetime, timedelta, timezone, time

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from uuid import UUID

from app.dto.desktop.desktop_request import AttendanceEventDTO, BulkAttendanceSyncDTO
from app.dto.desktop.desktop_response import CardReplaceResponseDTO
from app.dto.desktop.desktop_response import (
    AttendanceAckDTO,
    BulkAttendanceResponseDTO,
    PingResponseDTO,
    StudentSyncDTO,
)
from app.enums import StatusAbsensi
from app.models.absensi import Absensi
from app.models.izin_keluar import IzinKeluar
from app.policy.desktop_policy import DesktopPolicy
from app.repositoriy.desktop_repository import DesktopRepository
from app.pubsub.desktop_pubsub import (
    publish_attendance_synced,
    publish_students_snapshot,
)


class DesktopService:
    WIB = timezone(timedelta(hours=7))
    DEFAULT_LATE_CUTOFF_TIME = time(7, 15)

    def __init__(
        self,
        db: AsyncSession,
        repo: DesktopRepository | None = None,
        policy: type[DesktopPolicy] = DesktopPolicy,
    ):
        self.repo = repo or DesktopRepository(db)
        self.policy = policy

    async def ping(self) -> PingResponseDTO:
        return PingResponseDTO(status="ok", server_time=datetime.now(timezone.utc))

    async def list_students(self) -> list[StudentSyncDTO]:
        try:
            student_rows = await self.repo.list_active_students()
            admin_rows = await self.repo.list_active_administrators()

            students = [
                StudentSyncDTO(
                    user_id=row.user_id,
                    nama_lengkap=row.nama_lengkap,
                    nisn=row.nis,
                    kelas_jurusan=row.kelas_jurusan,
                    rfid_number=row.rfid_number,
                    no_telephone_wali=row.no_telephone_wali,
                    user_type=row.user_type.value if hasattr(row.user_type, "value") else str(row.user_type),
                )
                for row in student_rows
            ]

            administrators = [
                StudentSyncDTO(
                    user_id=row.user_id,
                    nama_lengkap=row.username,
                    nisn=None,
                    kelas_jurusan=None,
                    user_type=row.user_type.value if hasattr(row.user_type, "value") else str(row.user_type),
                )
                for row in admin_rows
            ]

            payload = [*students, *administrators]
            publish_students_snapshot([item.model_dump(mode="json") for item in payload])
            return payload
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list students: {str(e)}",
            )

    async def assign_student_card(self, user_id: UUID, rfid_number: str) -> None:
        profile = await self.repo.find_student_profile_by_user_id(user_id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        if profile.rfid_number is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Student already has a card. Remove it via web admin first.",
            )

        existing = await self.repo.find_student_profile_by_rfid_number(rfid_number)
        if existing is not None and existing.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Card {rfid_number} is already assigned to another student.",
            )

        profile.rfid_number = rfid_number
        await self.repo.commit()

    async def remove_student_card(self, user_id: UUID) -> CardReplaceResponseDTO:
        profile = await self.repo.find_student_profile_by_user_id(user_id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        old_rfid_number = profile.rfid_number
        profile.rfid_number = None
        await self.repo.commit()
        return CardReplaceResponseDTO(old_rfid_number=old_rfid_number)

    async def replace_student_card(self, user_id: UUID, new_rfid_number: str) -> CardReplaceResponseDTO:
        profile = await self.repo.find_student_profile_by_user_id(user_id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        existing = await self.repo.find_student_profile_by_rfid_number(new_rfid_number)
        if existing is not None and existing.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Card {new_rfid_number} is already assigned to another student.",
            )

        old_rfid_number = profile.rfid_number
        profile.rfid_number = new_rfid_number
        await self.repo.commit()
        return CardReplaceResponseDTO(old_rfid_number=old_rfid_number)

    async def sync_attendance(self, request: BulkAttendanceSyncDTO) -> BulkAttendanceResponseDTO:
        results: list[AttendanceAckDTO] = []
        for event in request.events:
            try:
                normalized_event = self._normalize_event_time(event)
                ack = await self._process_event(normalized_event)
                results.append(ack)
            except Exception as e:
                results.append(
                    AttendanceAckDTO(
                        record_id=event.record_id,
                        status="error",
                        published_at=datetime.now(timezone.utc),
                        detail=str(e.detail) if hasattr(e, "detail") else str(e),
                    )
                )
        await self.repo.commit()
        publish_attendance_synced(
            {
                "total": len(request.events),
                "ok": sum(1 for r in results if r.status == "ok"),
                "error": sum(1 for r in results if r.status != "ok"),
                "published_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        return BulkAttendanceResponseDTO(results=results)

    def _normalize_event_time(self, event: AttendanceEventDTO) -> AttendanceEventDTO:
        if event.device_time.tzinfo is None:
            event.device_time = event.device_time.replace(tzinfo=self.WIB)
        return event

    async def _process_event(self, event: AttendanceEventDTO) -> AttendanceAckDTO:
        try:
            if event.event_type == "absen_masuk":
                return await self._handle_absen_masuk(event)
            if event.event_type == "absen_keluar":
                return await self._handle_absen_keluar(event)
            if event.event_type == "izin":
                return await self._handle_izin(event)
            return AttendanceAckDTO(
                record_id=event.record_id,
                status="error",
                published_at=datetime.now(timezone.utc),
                detail=f"Unknown event type: {event.event_type}",
            )
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process attendance event: {str(e)}",
            )

    async def _validate_active_siswa(self, user_id):
        user = await self.repo.find_user_by_id(user_id)
        self.policy.ensure_active_student(user, user_id)

    async def _handle_absen_masuk(self, event: AttendanceEventDTO) -> AttendanceAckDTO:
        await self._validate_active_siswa(event.user_id)
        today = event.device_time.date()

        existing = await self.repo.find_absensi_by_user_and_date(event.user_id, today)
        cutoff = await self._get_late_cutoff_time()
        attendance_status = (
            StatusAbsensi.terlambat
            if event.device_time.time() > cutoff
            else StatusAbsensi.hadir
        )

        if existing:
            existing.time_in = event.device_time
            existing.status = attendance_status
        else:
            await self.repo.add_absensi(
                Absensi(
                    user_id=event.user_id,
                    tanggal=today,
                    time_in=event.device_time,
                    status=attendance_status,
                )
            )

        await self.repo.flush()
        return self._ok_ack(event.record_id)

    async def _get_late_cutoff_time(self) -> time:
        settings = await self.repo.get_desktop_settings()
        if settings and settings.late_cutoff_time:
            return settings.late_cutoff_time
        return self.DEFAULT_LATE_CUTOFF_TIME

    async def _handle_absen_keluar(self, event: AttendanceEventDTO) -> AttendanceAckDTO:
        today = event.device_time.date()
        existing = await self.repo.find_absensi_by_user_and_date(event.user_id, today)

        if not existing:
            await self.repo.add_absensi(
                Absensi(
                    user_id=event.user_id,
                    tanggal=today,
                    time_out=event.device_time,
                    status=StatusAbsensi.hadir,
                )
            )
        else:
            existing.time_out = event.device_time

        await self.repo.flush()
        return self._ok_ack(event.record_id)

    async def _handle_izin(self, event: AttendanceEventDTO) -> AttendanceAckDTO:
        await self._validate_active_siswa(event.user_id)
        self.policy.ensure_izin_has_reason(event.reason)

        today = event.device_time.date()
        start_of_day, end_of_day = self._build_day_bounds(today, event.device_time.tzinfo)

        existing = await self.repo.find_izin_by_user_and_range(
            event.user_id, start_of_day, end_of_day
        )
        if existing:
            existing.keterangan = event.reason
            existing.created_at = event.device_time
            existing.perkiraan_kembali = event.perkiraan_kembali
        else:
            await self.repo.add_izin(
                IzinKeluar(
                    user_id=event.user_id,
                    keterangan=event.reason,
                    created_at=event.device_time,
                    perkiraan_kembali=event.perkiraan_kembali,
                )
            )

        await self.repo.flush()
        return self._ok_ack(event.record_id)

    def _build_day_bounds(self, day: date, tz) -> tuple[datetime, datetime]:
        start = datetime.combine(day, datetime.min.time(), tzinfo=tz)
        end = datetime.combine(day, datetime.max.time(), tzinfo=tz)
        return start, end

    def _ok_ack(self, record_id: str) -> AttendanceAckDTO:
        return AttendanceAckDTO(
            record_id=record_id,
            status="ok",
            published_at=datetime.now(timezone.utc),
        )

