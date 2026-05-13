from sqlalchemy import select

from app.config.database import async_session_maker
from app.config.settings import settings
from app.enums import RegistrationStatus, UserType
from app.models.user import User


async def seed_admin() -> None:
    admins = [
        {"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
        {"username": settings.ADMIN2_USERNAME, "password": settings.ADMIN2_PASSWORD},
        {"username": settings.ADMIN3_USERNAME, "password": settings.ADMIN3_PASSWORD},
    ]

    async with async_session_maker() as session:
        for admin in admins:
            result = await session.execute(
                select(User).where(User.username == admin["username"])
            )
            if result.scalar_one_or_none():
                continue

            user = User(
                username=admin["username"],
                user_type=UserType.admin,
                registration_status=RegistrationStatus.completed,
                is_active=True,
            )
            user.set_password(admin["password"])
            session.add(user)
            print(f"[seed] admin created: {admin['username']}")

        await session.commit()
