from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from uuid import UUID
import jwt
from jwt.exceptions import InvalidTokenError
from app.config.settings import settings


class JWTManager:
    """JWT token generation and validation"""

    def __init__(
        self,
        secret_key: Optional[str] = None,
        algorithm: Optional[str] = None,
        access_token_expire_minutes: Optional[int] = None
    ):
        self.secret_key = secret_key or settings.JWT_SECRET_KEY
        self.algorithm = algorithm or settings.JWT_ALGORITHM
        self.access_token_expire_minutes = access_token_expire_minutes or settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES

    def create_access_token(
        self,
        user_id: UUID,
        username: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create JWT access token

        Args:
            user_id: User ID
            username: Username
            expires_delta: Custom expiration time

        Returns:
            str: Encoded JWT token
        """
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)

        to_encode = {
            "sub": str(user_id),  # Subject (user_id)
            "username": username,
            "exp": expire,  # Expiration time
            "iat": datetime.now(timezone.utc),  # Issued at
            "type": "access"
        }

        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(
        self,
        user_id: UUID,
        username: str,
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

        to_encode = {
            "sub": str(user_id),
            "username": username,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "refresh",
        }
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode JWT token

        Args:
            token: JWT token string

        Returns:
            dict: Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except InvalidTokenError:
            return None

    def verify_refresh_token(self, token: str) -> Optional[Dict[str, Any]]:
        payload = self.verify_token(token)
        if not payload:
            return None
        if payload.get("type") != "refresh":
            return None
        return payload

    def verify_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        payload = self.verify_token(token)
        if not payload:
            return None
        if payload.get("type") != "access":
            return None
        return payload

    def get_token_expiration(self) -> int:
        """Get token expiration time in seconds"""
        return self.access_token_expire_minutes * 60
