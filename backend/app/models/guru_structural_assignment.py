from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, ForeignKey, UUID as SQLAlchemyUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class GuruStructuralAssignment(Base):
    __tablename__ = "guru_structural_assignments"

    assignment_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    role_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("structural_roles.role_id", ondelete="CASCADE"),
        nullable=False,
    )
    tahun_ajaran_id: Mapped[UUID | None] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        nullable=True,
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user = relationship("User")
    role = relationship("StructuralRoleRef", back_populates="assignments")
    def __repr__(self) -> str:
        return f"GuruStructuralAssignment(user_id={self.user_id}, role_id={self.role_id}, active={self.is_active})"
