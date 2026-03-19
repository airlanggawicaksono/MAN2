from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.config.settings import settings
from app.dependencies import bearer_scheme
from app.services.auth_service import AuthService
from app.dto.auth.auth_request import LoginRequestDTO
from app.dto.auth.auth_response import (
    UserResponseDTO,
    TokenResponseDTO,
    MessageResponseDTO
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]
)


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.JWT_REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.JWT_REFRESH_COOKIE_SECURE,
        samesite=settings.JWT_REFRESH_COOKIE_SAMESITE,
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.JWT_REFRESH_COOKIE_NAME,
        path="/",
    )


@router.post(
    "/login",
    response_model=TokenResponseDTO,
    summary="User Login",
    description="Login with username and password to get JWT access token"
)
async def login(
    request: LoginRequestDTO,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> TokenResponseDTO:
    """
    Login with username and password

    - **username**: Your username
    - **password**: Your password

    Returns JWT access token and user information on success.
    """
    service = AuthService(db)
    token_response = await service.login(request)
    refresh_token = service.issue_refresh_token_for_user(token_response.user)
    _set_refresh_cookie(response, refresh_token)
    return token_response


@router.post(
    "/refresh",
    response_model=TokenResponseDTO,
    summary="Refresh Access Token",
    description="Issue new access token from refresh token cookie",
)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponseDTO:
    refresh_token_value = request.cookies.get(settings.JWT_REFRESH_COOKIE_NAME)
    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    service = AuthService(db)
    token_response, new_refresh_token = await service.refresh_access_token(refresh_token_value)
    _set_refresh_cookie(response, new_refresh_token)
    return token_response


@router.get(
    "/verify",
    response_model=UserResponseDTO,
    summary="Verify Token",
    description="Verify JWT token and get user information"
)
async def verify(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserResponseDTO:
    service = AuthService(db)
    return await service.verify_token(credentials.credentials)


@router.post(
    "/logout",
    response_model=MessageResponseDTO,
    summary="User Logout",
    description="Logout user (invalidate token on client side)"
)
async def logout(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> MessageResponseDTO:
    service = AuthService(db)
    result = await service.logout(credentials.credentials)
    _clear_refresh_cookie(response)
    return result
