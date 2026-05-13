from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path



class Settings(BaseSettings):
    """
    Application settings loaded from environment variables

    Reads from .env file automatically
    Priority: Environment variables > backend/.env > root .env
    """

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent.parent / ".env.dev"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    DEV_MODE: bool = False

    # Application Configuration
    ENVIRONMENT: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_WORKERS: int = 4
    APP_RELOAD: bool = True

    # Database Configuration
    DB_USER: str = "simandaya"
    DB_PASSWORD: str = "simandaya_dev_password"
    DB_NAME: str = "simandaya_db"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432

    # Optional: Direct DATABASE_URL override (takes precedence if set)
    DATABASE_URL: Optional[str] = None

    # Database Connection Pool Settings
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # JWT Configuration
    JWT_SECRET_KEY: str = "your-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_REFRESH_COOKIE_NAME: str = "refresh_token"
    JWT_REFRESH_COOKIE_SECURE: bool = False
    JWT_REFRESH_COOKIE_SAMESITE: str = "lax"

    # Password Hashing Configuration
    BCRYPT_ROUNDS: int = 12

    # Admin Seed Credentials (up to 3 accounts)
    ADMIN_USERNAME: str = "admin123"
    ADMIN_PASSWORD: str = "1qaz3edc2wsx4rfv"
    ADMIN2_USERNAME: str = "admin456"
    ADMIN2_PASSWORD: str = "1qaz3edc2wsx4rfv"
    ADMIN3_USERNAME: str = "admin789"
    ADMIN3_PASSWORD: str = "1qaz3edc2wsx4rfv"

    # Desktop App Configuration
    DESKTOP_API_KEY: str = "change-this-desktop-api-key"
    CORS_ORIGINS: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def database_url(self) -> str:
        """
        Construct async PostgreSQL database URL
        Uses DATABASE_URL if set, otherwise constructs from components
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def cors_origins(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if not raw:
            return []
        return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


# Singleton instance
settings = Settings()
