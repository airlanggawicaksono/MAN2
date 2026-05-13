from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config.logging import setup_logging, get_logger
from app.config.database import init_db, close_db
from app.pubsub.desktop_pubsub import register_desktop_pubsub
from app.seeds import seed_admin
from app.routers import (
    auth, users, absensi,
    desktop, jobs,
)
from app.config.settings import settings
from app.middleware.request_log import RequestLogMiddleware

setup_logging()
log = get_logger("simandaya.main")


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
    log.info(f"app_startup env={settings.ENVIRONMENT} dev_mode={settings.DEV_MODE}")
    await init_db(drop_existing=settings.DEV_MODE)
    await seed_admin()
    log.info("app_ready")
    yield
    # Shutdown
    log.info("app_shutdown")
    await close_db()


_is_prod = settings.ENVIRONMENT == "production"

# Create FastAPI app
app = FastAPI(
    title="Simandaya API",
    description="Backend API for Simandaya Web Application with username/password authentication",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
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

# Request logging (added first so it wraps everything else)
app.add_middleware(RequestLogMiddleware)

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
app.include_router(jobs.router)


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
