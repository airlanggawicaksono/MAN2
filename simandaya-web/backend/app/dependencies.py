from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.config.database import get_db
from app.config.settings import settings
from app.models.user import User
from app.utils.jwt_utils import JWTManager
from app.enums import UserType, RegistrationStatus

bearer_scheme = HTTPBearer()
jwt_manager = JWTManager()
desktop_api_key_header = APIKeyHeader(name="X-API-Key")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency that extracts JWT from header and returns the authenticated User.

    Raises:
        HTTPException: 401 if token is invalid/expired
        HTTPException: 404 if user not found
        HTTPException: 403 if user is deactivated
    """
    payload = jwt_manager.verify_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = UUID(payload["sub"])
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    if user.registration_status == RegistrationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registrasi belum selesai. Silakan lengkapi pendaftaran."
        )

    return user


def require_role(*allowed_roles: UserType):
    """
    Dependency factory that checks if the current user has one of the allowed roles.

    Usage:
        @router.post("/students")
        async def create_student(
            user: User = Depends(require_role(UserType.admin, UserType.guru)),
        ):

    Raises:
        HTTPException: 403 if user does not have the required role
    """
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.user_type not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(r.value for r in allowed_roles)}"
            )
        return user
    return checker


async def verify_desktop_api_key(
    api_key: str = Depends(desktop_api_key_header),
) -> str:
    """
    Dependency that validates the desktop app API key from X-API-Key header.

    Raises:
        HTTPException: 401 if API key is invalid
    """
    if api_key != settings.DESKTOP_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid desktop API key"
        )
    return api_key
