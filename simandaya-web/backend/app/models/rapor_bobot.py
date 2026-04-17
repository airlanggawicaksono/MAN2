from uuid import UUID, uuid4

from sqlalchemy import (
    Enum as SQLAlchemyEnum,
    Numeric,
    UUID as SQLAlchemyUUID,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base
from app.enums import JenisTugas


class RaporBobot(Base):
    __tablename__ = "rapor_bobot"
    __table_args__ = (
        UniqueConstraint(
            "kelas_id", "semester_id", "mapel_id", "jenis_tugas",
            name="uq_rapor_bobot_context_jenis",
        ),
    )

    rapor_bobot_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
    )

    kelas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("kelas.kelas_id", ondelete="CASCADE"),
        nullable=False,
    )
    semester_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("semester.semester_id", ondelete="CASCADE"),
        nullable=False,
    )
    mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("mata_pelajaran.mapel_id", ondelete="CASCADE"),
        nullable=False,
    )

    jenis_tugas: Mapped[JenisTugas] = mapped_column(
        SQLAlchemyEnum(JenisTugas, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    bobot: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    kelas: Mapped["Kelas"] = relationship()
    semester: Mapped["Semester"] = relationship()
    mapel: Mapped["MataPelajaran"] = relationship()
