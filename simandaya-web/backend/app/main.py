from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config.database import init_db, close_db
from app.routers import (
    auth, users, absensi,
    tahun_ajaran, semester, kalender, mapel, slot_waktu,
    kelas, jadwal,
    tugas, nilai, bobot,
    rapor, registration,
    desktop,
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
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local/desktop apps
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
app.include_router(bobot.router)
app.include_router(rapor.router)
app.include_router(desktop.router)


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
