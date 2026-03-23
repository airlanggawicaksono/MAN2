from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config.database import init_db, close_db
from app.pubsub.desktop_pubsub import register_desktop_pubsub
from app.routers import (
    auth, users, absensi,
    tahun_ajaran, semester, kalender, mapel, slot_waktu,
    kelas, jadwal,
    tugas, nilai,
    rapor, registration,
    desktop, kurikulum,
    kategori_kelas,
)
from app.config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events

    Startup:
        - Initialize database tables
    Shutdown:
        - Close database connections
    """
    # Startup
    await init_db(drop_existing=settings.DEV_MODE)
    yield
    # Shutdown
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="Simandaya API",
    description="Backend API for Simandaya Web Application with username/password authentication",
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Public - Authentication"},
        {"name": "Public - Registration"},
        {"name": "Public - Users"},
        {"name": "Public - Absensi"},
        {"name": "Admin - Absensi"},
        {"name": "Admin - Users (Structural)"},
        {"name": "Admin - Kalender Akademik"},
        {"name": "Admin - Mata Pelajaran"},
        {"name": "Admin - Slot Waktu"},
        {"name": "Admin - Kurikulum"},
        {"name": "Admin - Kategori Kelas"},
        {"name": "Admin - Kelas"},
        {"name": "Admin - Jadwal"},
        {"name": "Admin - Desktop Device"},
        {"name": "Admin + Guru + Siswa - Tahun Ajaran"},
        {"name": "Admin + Guru + Siswa - Semester"},
        {"name": "Admin + Guru - Users"},
        {"name": "Admin + Siswa - Users"},
        {"name": "Admin + Guru - Tugas"},
        {"name": "Admin + Guru - Nilai"},
        {"name": "Admin + Guru - Rapor"},
        {"name": "Siswa - Kelas"},
        {"name": "Siswa - Jadwal"},
        {"name": "Siswa - Tugas"},
        {"name": "Siswa - Nilai"},
        {"name": "Siswa - Rapor"},
        {"name": "Guru - Kelas"},
        {"name": "Guru - Jadwal"},
        {"name": "Root"},
        {"name": "Health"},
    ],
)
register_desktop_pubsub(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(registration.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(absensi.router)
app.include_router(tahun_ajaran.router)
app.include_router(semester.router)
app.include_router(kalender.router)
app.include_router(mapel.router)
app.include_router(slot_waktu.router)
app.include_router(kelas.router)
app.include_router(jadwal.router)
app.include_router(tugas.router)
app.include_router(nilai.router)
app.include_router(rapor.router)
app.include_router(desktop.router)
app.include_router(kurikulum.router)
app.include_router(kategori_kelas.router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Simandaya API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "simandaya-api"
    }
