from uuid import UUID, uuid4
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    Boolean,
    Enum as SQLAlchemyEnum,
    UUID as SQLAlchemyUUID, ForeignKey, Index, text
)
from app.config.database import Base
from app.enums import HariSekolah


class Jadwal(Base):
    __tablename__ = "jadwal"
    __table_args__ = (
        Index(
            "ux_jadwal_active_kelas_slot",
            "semester_id",
            "hari",
            "slot_waktu_id",
            "kelas_id",
            unique=True,
            postgresql_where=text("is_active"),
        ),
        Index(
            "ux_jadwal_active_guru_slot",
            "semester_id",
            "hari",
            "slot_waktu_id",
            "guru_user_id",
            unique=True,
            postgresql_where=text("is_active"),
        ),
    )

    jadwal_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    semester_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("semester.semester_id", ondelete="CASCADE"),
        nullable=False
    )
    kelas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("kelas.kelas_id", ondelete="CASCADE"),
        nullable=False
    )
    mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("mata_pelajaran.mapel_id", ondelete="CASCADE"),
        nullable=False
    )
    guru_user_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )
    hari: Mapped[HariSekolah] = mapped_column(
        SQLAlchemyEnum(HariSekolah, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    slot_waktu_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("slot_waktu.slot_id", ondelete="CASCADE"),
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    semester: Mapped["Semester"] = relationship()
    kelas: Mapped["Kelas"] = relationship()
    mapel: Mapped["MataPelajaran"] = relationship()
    guru: Mapped["User"] = relationship()
    slot_waktu: Mapped["SlotWaktu"] = relationship()

    def __repr__(self) -> str:
        return f"Jadwal(hari={self.hari}, kelas_id={self.kelas_id})"
