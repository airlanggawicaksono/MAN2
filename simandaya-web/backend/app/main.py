from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config.database import init_db, close_db
from app.pubsub.desktop_pubsub import register_desktop_pubsub
from app.routers import (
    auth, users, absensi,
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
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Public - Authentication"},
        {"name": "Public - Registration"},
        {"name": "Public - Users"},
        {"name": "Public - Absensi"},
        {"name": "Admin - Absensi"},
        {"name": "Admin - Users (Structural)"},
        {"name": "Admin - Desktop Device"},
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
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(absensi.router)
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
