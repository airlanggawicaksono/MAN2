from passlib.context import CryptContext
from app.config.settings import settings


class PasswordManager:
    """
    Password hashing and verification using bcrypt

    Uses bcrypt with configurable rounds for secure password hashing.
    NEVER store plain passwords - always hash before storing in database.
    """

    def __init__(self, rounds: int | None = None):
        """
        Initialize password manager with bcrypt

        Args:
            rounds: Number of bcrypt rounds (default from settings)
        """
        bcrypt_rounds = rounds or settings.BCRYPT_ROUNDS
        self.pwd_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=bcrypt_rounds
        )

    def hash_password(self, plain_password: str) -> str:
        """
        Hash a plain password using bcrypt

        Args:
            plain_password: Plain text password

        Returns:
            str: Hashed password (safe to store in database)
        """
        return self.pwd_context.hash(plain_password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain password against a hashed password

        Args:
            plain_password: Plain text password from user input
            hashed_password: Hashed password from database

        Returns:
            bool: True if password matches, False otherwise
        """
        return self.pwd_context.verify(plain_password, hashed_password)
