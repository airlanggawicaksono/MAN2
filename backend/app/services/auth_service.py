from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.utils.jwt_utils import JWTManager
from app.repositoriy.auth_repository import AuthRepository
from app.policy.auth_policy import AuthPolicy
from app.dto.auth.auth_request import SignupRequestDTO, LoginRequestDTO
from app.dto.auth.auth_response import (
    UserResponseDTO,
    TokenResponseDTO,
    SignupResponseDTO,
    MessageResponseDTO
)


class AuthService:
    """
    Authentication service for username/password auth

    Password hashing/verification is handled by the User model.

    Raises:
        HTTPException: 400, 401, 403, 404, 500
    """

    def __init__(
        self,
        db: AsyncSession,
        jwt_manager: JWTManager | None = None,
        repo: AuthRepository | None = None,
        policy: type[AuthPolicy] = AuthPolicy,
    ):
        self.repo = repo or AuthRepository(db)
        self.policy = policy
        self.jwt_manager = jwt_manager or JWTManager()

    async def signup(self, request: SignupRequestDTO) -> SignupResponseDTO:
        """
        User signup - creates new user with username and password

        Args:
            request: Signup request with username and password

        Returns:
            SignupResponseDTO: Created user information

        Raises:
            HTTPException: 400 if username already exists
            HTTPException: 500 if database error occurs
        """
        try:
            existing_user = await self.repo.find_by_username(request.username)
            self.policy.ensure_username_available(
                is_taken=existing_user is not None,
                username=request.username,
            )

            user = User(
                username=request.username,
                user_type=request.user_type,
            )
            user.set_password(request.password)

            # Save to database
            await self.repo.add_user(user)
            await self.repo.commit()
            await self.repo.refresh(user)

            return SignupResponseDTO(
                message="User created successfully",
                user=self._to_user_dto(user)
            )

        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )

    async def login(self, request: LoginRequestDTO) -> TokenResponseDTO:
        """
        User login with username and password

        Args:
            request: Login request with username and password

        Returns:
            TokenResponseDTO: JWT token and user info

        Raises:
            HTTPException: 401 if credentials are invalid
            HTTPException: 403 if user account is deactivated
        """
        user = await self.repo.find_by_username(request.username)
        self.policy.ensure_valid_credentials(user, request.password)
        self.policy.ensure_user_active(user)
        self.policy.ensure_admin_only(user)

        # Update last login
        user.update_last_login()
        await self.repo.commit()

        token_response, _ = self._build_token_pair(user)
        return token_response

    async def verify_token(self, token: str) -> UserResponseDTO:
        """
        Verify JWT token and return user info

        Args:
            token: JWT access token

        Returns:
            UserResponseDTO: User information

        Raises:
            HTTPException: 401 if token is invalid or expired
            HTTPException: 404 if user not found
            HTTPException: 403 if user account is deactivated
        """
        payload = self.jwt_manager.verify_access_token(token)
        self.policy.ensure_valid_token_payload(payload)

        user_id = UUID(payload["sub"])

        user = await self.repo.find_by_id(user_id)
        self.policy.ensure_user_exists(user)
        self.policy.ensure_user_active(user)

        return self._to_user_dto(user)

    async def logout(self, token: str) -> MessageResponseDTO:
        """
        Logout user (basic implementation)

        Args:
            token: JWT access token

        Returns:
            MessageResponseDTO: Success message

        Raises:
            HTTPException: 401 if token is invalid

        Note:
            This is a basic implementation. For production, consider:
            - Redis-based token blacklist
            - Token versioning in database
        """
        # Verify token is valid
        payload = self.jwt_manager.verify_access_token(token)
        self.policy.ensure_valid_token_payload(payload)

        # In basic implementation, client is responsible for deleting token
        # Future: Add Redis blacklist here
        return MessageResponseDTO(
            message="Logged out successfully"
        )

    async def refresh_access_token(self, refresh_token: str) -> tuple[TokenResponseDTO, str]:
        payload = self.jwt_manager.verify_refresh_token(refresh_token)
        self.policy.ensure_valid_token_payload(payload)

        user_id = UUID(payload["sub"])
        user = await self.repo.find_by_id(user_id)
        self.policy.ensure_user_exists(user)
        self.policy.ensure_user_active(user)
        self.policy.ensure_registration_completed(user)

        return self._build_token_pair(user)

    def issue_refresh_token_for_user(self, user) -> str:
        return self.jwt_manager.create_refresh_token(
            user_id=user.user_id,
            username=user.username,
        )

    def _build_token_pair(self, user: User) -> tuple[TokenResponseDTO, str]:
        access_token = self.jwt_manager.create_access_token(
            user_id=user.user_id,
            username=user.username
        )
        refresh_token = self.jwt_manager.create_refresh_token(
            user_id=user.user_id,
            username=user.username
        )

        return (
            TokenResponseDTO(
                access_token=access_token,
                token_type="bearer",
                expires_in=self.jwt_manager.get_token_expiration(),
                user=self._to_user_dto(user)
            ),
            refresh_token,
        )

    @staticmethod
    def _to_user_dto(user: User) -> UserResponseDTO:
        return UserResponseDTO(
            user_id=user.user_id,
            username=user.username,
            user_type=user.user_type.value,
            registration_status=user.registration_status.value,
            created_at=user.created_at,
            last_login=user.last_login,
            is_active=user.is_active,
        )
