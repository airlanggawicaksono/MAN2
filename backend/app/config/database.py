from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncAttrs
from typing import AsyncGenerator
from app.config.settings import settings


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
    print("[DB] Creating new session...")
    async with async_session_maker() as session:
        try:
            yield session
            # Note: We don't auto-commit here anymore as it can cause 
            # "hangs" if the yield never returns or if the route 
            # already committed. The routers should handle their own commit.
        except Exception as e:
            print(f"[DB] Session error: {e}")
            await session.rollback()
            raise
        finally:
            print("[DB] Closing session...")
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
        if drop_existing:
            print("WARNING: Dropping all existing tables...")
            await conn.run_sync(Base.metadata.drop_all)

        print("Creating/updating database tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Database initialized successfully")


async def close_db():
    """Close database connections (run on shutdown)"""
    await engine.dispose()
