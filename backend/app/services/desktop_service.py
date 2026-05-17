from datetime import date, datetime, timedelta, timezone, time

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from uuid import UUID

from app.dto.desktop.desktop_request import AttendanceEventDTO, BulkAttendanceSyncDTO
from app.dto.desktop.desktop_response import (
    AttendanceAckDTO,
    BulkAttendanceResponseDTO,
    CardSetResponseDTO,
    PingResponseDTO,
    StudentSyncDTO,
)
from app.enums import DeviceJobType, StatusAbsensi
from app.models.absensi import Absensi
from app.models.izin_keluar import IzinKeluar
from app.policy.desktop_policy import DesktopPolicy
from app.repositoriy.desktop_repository import DesktopRepository
from app.pubsub.desktop_pubsub import (
    publish_absensi_changed,
    publish_attendance_synced,
    publish_job_created,
)
from app.services.device_job_service import DeviceJobService


class DesktopService:
    WIB = timezone(timedelta(hours=7))
    DEFAULT_LATE_CUTOFF_TIME = time(7, 15)

    def __init__(
        self,
        db: AsyncSession,
        repo: DesktopRepository | None = None,
        policy: type[DesktopPolicy] = DesktopPolicy,
        job_service: DeviceJobService | None = None,
    ):
        self.db = db
        self.repo = repo or DesktopRepository(db)
        self.policy = policy
        self.job_service = job_service or DeviceJobService(db)

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

            return [*students, *administrators]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list students: {str(e)}",
            )

    async def set_student_card(
        self,
        user_id: UUID,
        new_rfid_number: str | None,
    ) -> CardSetResponseDTO:
        """
        Single canonical entry point for assigning, replacing, or removing
        a student's RFID card.

        Writes BE state and enqueues a hik.card.sync DeviceJob in the same
        transaction, then publishes a WS notification for fast worker pickup.
        """
        profile = await self._load_profile_or_404(user_id)
        old_rfid = profile.rfid_number

        if old_rfid == new_rfid_number:
            return await self._build_noop_response(user_id, old_rfid)

        await self._guard_card_not_owned_elsewhere(new_rfid_number, user_id)

        profile.rfid_number = new_rfid_number
        job = await self._enqueue_card_sync_job(user_id, profile.nama_lengkap, old_rfid, new_rfid_number)
        await self.repo.commit()

        publish_job_created(job.id, job.job_type)
        return CardSetResponseDTO(
            user_id=user_id,
            old_rfid_number=old_rfid,
            new_rfid_number=new_rfid_number,
            job_id=job.id,
        )

    async def _load_profile_or_404(self, user_id: UUID):
        profile = await self.repo.find_student_profile_by_user_id(user_id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        return profile

    async def _guard_card_not_owned_elsewhere(
        self,
        new_rfid_number: str | None,
        user_id: UUID,
    ) -> None:
        if new_rfid_number is None:
            return
        existing = await self.repo.find_student_profile_by_rfid_number(new_rfid_number)
        if existing is None:
            return
        if existing.user_id == user_id:
            return
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Card {new_rfid_number} is already assigned to another student.",
        )

    async def _enqueue_card_sync_job(
        self,
        user_id: UUID,
        name: str,
        old_rfid: str | None,
        new_rfid: str | None,
    ):
        payload = {
            "user_id": str(user_id),
            # Hikvision `employeeNo` is 32-char hex (no separators); see
            # `hikvisionEmployeeNoFor` on sijinak for the canonical adapter.
            "employee_no": user_id.hex,
            "name": name,
            "old_rfid": old_rfid,
            "new_rfid": new_rfid,
        }
        return await self.job_service.enqueue(
            job_type=DeviceJobType.hik_card_sync.value,
            payload=payload,
            related_user_id=user_id,
        )

    async def _build_noop_response(
        self,
        user_id: UUID,
        rfid: str | None,
    ) -> CardSetResponseDTO:
        """
        No-op writes still enqueue a re-sync job so the worker can repair
        Hikvision drift if the device was missing the binding.
        """
        job = await self._enqueue_card_sync_job(user_id, name="", old_rfid=rfid, new_rfid=rfid)
        await self.repo.commit()
        publish_job_created(job.id, job.job_type)
        return CardSetResponseDTO(
            user_id=user_id,
            old_rfid_number=rfid,
            new_rfid_number=rfid,
            job_id=job.id,
        )

    async def sync_attendance(self, request: BulkAttendanceSyncDTO) -> BulkAttendanceResponseDTO:
        results: list[AttendanceAckDTO] = []
        ok_events: list[AttendanceEventDTO] = []
        for event in request.events:
            try:
                normalized_event = self._normalize_event_time(event)
                ack = await self._process_event(normalized_event)
                results.append(ack)
                if ack.status == "ok":
                    ok_events.append(normalized_event)
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
        self._publish_absensi_invalidations(ok_events)
        return BulkAttendanceResponseDTO(results=results)

    def _publish_absensi_invalidations(self, ok_events: list[AttendanceEventDTO]) -> None:
        """
        Group successful events by (date, user_id) and fan out a single
        invalidation per group so sijinak can drop stale local locks.

        Same-process sijinak that originated these events will receive its
        own broadcast — harmless because the invalidation is idempotent
        (deletes local cache rows that match the BE truth anyway).
        """
        by_date: dict[date, set[UUID]] = {}
        for event in ok_events:
            day = event.device_time.date()
            by_date.setdefault(day, set()).add(event.user_id)

        for day, user_ids in by_date.items():
            publish_absensi_changed(
                user_ids=user_ids,
                affected_date=day,
                kind="upsert",
            )

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

