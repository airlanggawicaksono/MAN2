from datetime import datetime, time, timezone
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.siswa_profile import SiswaProfile
from app.models.absensi import Absensi
from app.models.izin_keluar import IzinKeluar
from app.models.desktop_settings import DesktopSettings
from app.enums import UserType, StatusAbsensi
from app.dto.desktop.desktop_request import AttendanceEventDTO, BulkAttendanceSyncDTO
from app.dto.desktop.desktop_response import (
    StudentSyncDTO,
    AttendanceAckDTO,
    BulkAttendanceResponseDTO,
    DesktopSettingsDTO,
)


class DesktopService:
    """
    Service for desktop app operations: student sync, attendance processing, settings.

    Raises:
        HTTPException: 400, 404, 500
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _validate_active_siswa(self, user_id: UUID) -> User:
        """
        Validate that user_id belongs to an active siswa.

        Raises:
            HTTPException: 404 if user not found
            HTTPException: 400 if user is not an active student
        """
        result = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found"
            )
        if user.user_type != UserType.siswa:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user_id} is not a student"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user_id} is not active"
            )
        return user

    async def _get_late_cutoff_time(self) -> time:
        """Get the late cutoff time from settings, defaults to 07:15."""
        result = await self.db.execute(
            select(DesktopSettings).where(DesktopSettings.id == 1)
        )
        settings_row = result.scalar_one_or_none()
        if settings_row:
            return settings_row.late_cutoff_time
        return time(7, 15)

    # ── Student Sync ─────────────────────────────────────────────────────────

    async def list_students(self) -> list[StudentSyncDTO]:
        """
        List all active students with their profile info for desktop sync.

        Raises:
            HTTPException: 500 on database error
        """
        result = await self.db.execute(
            select(
                User.user_id,
                SiswaProfile.nama_lengkap,
                SiswaProfile.nis,
                SiswaProfile.kelas_jurusan,
            )
            .join(SiswaProfile, User.user_id == SiswaProfile.user_id)
            .where(
                and_(
                    User.user_type == UserType.siswa,
                    User.is_active == True,
                )
            )
            .order_by(SiswaProfile.nama_lengkap)
        )
        rows = result.all()
        return [
            StudentSyncDTO(
                user_id=row.user_id,
                nama_lengkap=row.nama_lengkap,
                nis=row.nis,
                kelas_jurusan=row.kelas_jurusan,
            )
            for row in rows
        ]

    # ── Attendance Processing ────────────────────────────────────────────────

    async def process_attendance_event(self, event: AttendanceEventDTO) -> AttendanceAckDTO:
        """
        Process an attendance event from the desktop app.
        """
        print(f"[DesktopService] Processing {event.event_type} for user {event.user_id} at {event.device_time}")
        try:
            if event.event_type == "absen_masuk":
                return await self._handle_absen_masuk(event)
            elif event.event_type == "absen_keluar":
                return await self._handle_absen_keluar(event)
            elif event.event_type == "izin":
                return await self._handle_izin(event)
            else:
                print(f"[DesktopService] Unknown event type: {event.event_type}")
                return AttendanceAckDTO(
                    record_id=event.record_id,
                    status="error",
                    published_at=datetime.now(timezone.utc),
                    detail=f"Unknown event type: {event.event_type}"
                )
        except HTTPException as e:
            print(f"[DesktopService] HTTPException in {event.event_type}: {e.status_code} - {e.detail}")
            raise
        except Exception as e:
            print(f"[DesktopService] Unexpected Error in {event.event_type}: {e}")
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process attendance event: {str(e)}"
            )

    async def _handle_absen_masuk(self, event: AttendanceEventDTO) -> AttendanceAckDTO:
        """
        Handle check-in event.
        """
        await self._validate_active_siswa(event.user_id)
        cutoff = await self._get_late_cutoff_time()
        today = event.device_time.date()

        # Check existing absensi for today
        result = await self.db.execute(
            select(Absensi).where(
                and_(
                    Absensi.user_id == event.user_id,
                    Absensi.tanggal == today,
                )
            )
        )
        existing = result.scalar_one_or_none()

        # Determine status based on device_time vs cutoff
        device_local_time = event.device_time.time()
        attendance_status = (
            StatusAbsensi.terlambat if device_local_time > cutoff
            else StatusAbsensi.hadir
        )

        if existing:
            print(f"[DesktopService] Overwriting record for user {event.user_id} for {today}")
            existing.time_in = event.device_time
            existing.status = attendance_status
        else:
            print(f"[DesktopService] Creating NEW record for user {event.user_id} for {today}")
            record = Absensi(
                user_id=event.user_id,
                tanggal=today,
                time_in=event.device_time,
                status=attendance_status,
            )
            self.db.add(record)

        await self.db.flush()
        return AttendanceAckDTO(
            record_id=event.record_id,
            status="ok",
            published_at=datetime.now(timezone.utc),
        )

    async def _handle_absen_keluar(self, event: AttendanceEventDTO) -> AttendanceAckDTO:
        """
        Handle check-out event.
        """
        today = event.device_time.date()

        result = await self.db.execute(
            select(Absensi).where(
                and_(
                    Absensi.user_id == event.user_id,
                    Absensi.tanggal == today,
                )
            )
        )
        existing = result.scalar_one_or_none()

        if not existing:
            print(f"[DesktopService] No check-in found for user {event.user_id} on {today}. Creating new record with check-out only.")
            record = Absensi(
                user_id=event.user_id,
                tanggal=today,
                time_out=event.device_time,
                status=StatusAbsensi.hadir,
            )
            self.db.add(record)
        else:
            print(f"[DesktopService] Overwriting check-out for user {event.user_id} on {today} at {event.device_time}")
            existing.time_out = event.device_time
        
        await self.db.flush()

        return AttendanceAckDTO(
            record_id=event.record_id,
            status="ok",
            published_at=datetime.now(timezone.utc),
        )

    async def _handle_izin(self, event: AttendanceEventDTO) -> AttendanceAckDTO:
        """
        Handle izin event. Overwrites if already exists for today.
        """
        await self._validate_active_siswa(event.user_id)
        today = event.device_time.date()

        if not event.reason:
            return AttendanceAckDTO(
                record_id=event.record_id,
                status="error",
                published_at=datetime.now(timezone.utc),
                detail="Reason is required for izin event"
            )

        # Check for existing izin today
        result = await self.db.execute(
            select(IzinKeluar).where(
                and_(
                    IzinKeluar.user_id == event.user_id,
                    # Casting created_at to date for comparison
                    self.db.bind.dialect.name != 'postgresql' 
                    and True # Fallback for local testing
                    or False 
                )
            )
        )
        # Actually easier to just filter by time range for today
        from datetime import datetime as dt_class
        start_of_today = dt_class.combine(today, dt_class.min.time())
        end_of_today = dt_class.combine(today, dt_class.max.time())
        
        result = await self.db.execute(
            select(IzinKeluar).where(
                and_(
                    IzinKeluar.user_id == event.user_id,
                    IzinKeluar.created_at >= start_of_today,
                    IzinKeluar.created_at <= end_of_today,
                )
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"[DesktopService] Overwriting Izin for user {event.user_id} for {today}")
            existing.keterangan = event.reason
            existing.created_at = event.device_time
        else:
            print(f"[DesktopService] Creating NEW Izin for user {event.user_id} for {today}")
            izin = IzinKeluar(
                user_id=event.user_id,
                keterangan=event.reason,
                created_at=event.device_time,
            )
            self.db.add(izin)
            
        await self.db.flush()

        return AttendanceAckDTO(
            record_id=event.record_id,
            status="ok",
            published_at=datetime.now(timezone.utc),
        )

    async def sync_attendance(self, request: BulkAttendanceSyncDTO) -> BulkAttendanceResponseDTO:
        """
        Process multiple attendance events in a single HTTP request.
        Each event is processed independently; failures in one don't abort others.
        """
        from datetime import timezone, timedelta
        WIB = timezone(timedelta(hours=7))
        
        results = []
        for event in request.events:
            try:
                # If the time is naive (no offset), assume it's already WIB
                if event.device_time.tzinfo is None:
                    event.device_time = event.device_time.replace(tzinfo=WIB)
                
                ack = await self.process_attendance_event(event)
                results.append(ack)
            except Exception as e:
                # If one event fails, we record the error but continue with others
                record_id = event.record_id
                results.append(AttendanceAckDTO(
                    record_id=record_id,
                    status="error",
                    published_at=datetime.now(timezone.utc),
                    detail=str(e.detail) if hasattr(e, "detail") else str(e),
                ))

        # Commit all successful ones
        await self.db.commit()
        return BulkAttendanceResponseDTO(results=results)

    # ── Settings ─────────────────────────────────────────────────────────────

    async def get_settings(self) -> DesktopSettingsDTO:
        """
        Get desktop settings. Creates default row if none exists.

        Raises:
            HTTPException: 500 on database error
        """
        result = await self.db.execute(
            select(DesktopSettings).where(DesktopSettings.id == 1)
        )
        settings_row = result.scalar_one_or_none()

        if not settings_row:
            settings_row = DesktopSettings(id=1, late_cutoff_time=time(7, 15))
            self.db.add(settings_row)
            await self.db.flush()

        # Since get_db no longer auto-commits, we commit here
        await self.db.commit()

        return DesktopSettingsDTO(
            late_cutoff_time=settings_row.late_cutoff_time,
            updated_at=settings_row.updated_at,
        )

    async def update_settings(
        self, late_cutoff_time: time, admin_user_id: UUID
    ) -> DesktopSettingsDTO:
        """
        Update desktop settings (admin only).

        Raises:
            HTTPException: 500 on database error
        """
        result = await self.db.execute(
            select(DesktopSettings).where(DesktopSettings.id == 1)
        )
        settings_row = result.scalar_one_or_none()

        if settings_row:
            settings_row.late_cutoff_time = late_cutoff_time
            settings_row.updated_by = admin_user_id
        else:
            settings_row = DesktopSettings(
                id=1,
                late_cutoff_time=late_cutoff_time,
                updated_by=admin_user_id,
            )
            self.db.add(settings_row)

        await self.db.flush()
        await self.db.commit()

        return DesktopSettingsDTO(
            late_cutoff_time=settings_row.late_cutoff_time,
            updated_at=settings_row.updated_at,
        )
