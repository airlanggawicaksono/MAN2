from uuid import UUID, uuid4

from sqlalchemy import Boolean, String, UUID as SQLAlchemyUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class StructuralRoleRef(Base):
    __tablename__ = "structural_roles"

    role_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(225), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    assignments = relationship("GuruStructuralAssignment", back_populates="role")

    def __repr__(self) -> str:
        return f"StructuralRoleRef(code={self.code}, name={self.name})"
