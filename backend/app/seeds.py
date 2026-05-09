from sqlalchemy import select

from app.config.database import async_session_maker
from app.config.settings import settings
from app.enums import RegistrationStatus, UserType
from app.models.user import User


async def seed_admin() -> None:
    async with async_session_maker() as session:
        result = await session.execute(
            select(User).where(User.username == settings.ADMIN_USERNAME)
        )
        if result.scalar_one_or_none():
            return

        user = User(
            username=settings.ADMIN_USERNAME,
            user_type=UserType.admin,
            registration_status=RegistrationStatus.completed,
            is_active=True,
        )
        user.set_password(settings.ADMIN_PASSWORD)
        session.add(user)
        await session.commit()
        print(f"[seed] admin created: {settings.ADMIN_USERNAME}")
