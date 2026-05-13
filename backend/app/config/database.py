from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncAttrs
from typing import AsyncGenerator
from app.config.settings import settings
from app.config.logging import get_logger

log = get_logger("simandaya.db")


class Base(AsyncAttrs, DeclarativeBase):
    """
    Base model for all database models

    Inherits from:
    - AsyncAttrs: Enables async attribute loading
    - DeclarativeBase: SQLAlchemy 2.0 declarative base
    """
    pass


# Global async engine (created once, reused across requests)
engine: AsyncEngine = create_async_engine(
    settings.database_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW
)

# Global session factory (created once, generates sessions per request)
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database sessions

    Creates a new session per request, handles commits/rollbacks automatically.
    """
    async with async_session_maker() as session:
        try:
            yield session
            # Note: We don't auto-commit here anymore as it can cause
            # "hangs" if the yield never returns or if the route
            # already committed. The routers should handle their own commit.
        except Exception as e:
            log.warning(f"db_session_rollback err={e!r}")
            await session.rollback()
            raise
        finally:
            await session.close()



async def init_db(drop_existing: bool = False):
    """
    Initialize database tables (run on startup)

    Args:
        drop_existing: If True, drops all tables before creating (DEV ONLY!)
    """
    # Import all models to register them with Base.metadata
    from app.models.user import User  # noqa: F401
    from app.models.siswa_profile import SiswaProfile  # noqa: F401
    from app.models.guru_profile import GuruProfile  # noqa: F401
    from app.models.absensi import Absensi  # noqa: F401
    from app.models.izin_keluar import IzinKeluar  # noqa: F401
    from app.models.desktop_settings import DesktopSettings  # noqa: F401
    from app.models.structural_role_ref import StructuralRoleRef  # noqa: F401
    from app.models.guru_structural_assignment import GuruStructuralAssignment  # noqa: F401
    from app.models.job import Job  # noqa: F401

    async with engine.begin() as conn:
        # Serialize schema init across workers — prevents duplicate CREATE TYPE
        # race when uvicorn runs with --workers > 1. Lock released at txn end.
        await conn.execute(text("SELECT pg_advisory_xact_lock(8675309)"))

        if drop_existing:
            log.warning("db_drop_all")
            await conn.run_sync(Base.metadata.drop_all)

        log.info("db_create_all")
        await conn.run_sync(Base.metadata.create_all)
        log.info("db_init_ok")


async def close_db():
    """Close database connections (run on shutdown)"""
    await engine.dispose()
