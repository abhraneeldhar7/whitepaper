from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schema import User
from app.utils.helpers import now


async def get_user_by_id(db: AsyncSession, userId: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.userId == userId))
    return result.scalar_one_or_none()


async def username_exists(db: AsyncSession, username: str) -> bool:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none() is not None


async def delete_user(db: AsyncSession, userId: str) -> None:
    user = await get_user_by_id(db, userId)
    if user:
        await db.delete(user)


async def create_user(
    db: AsyncSession,
    userId: str,
    name: str,
    email: str,
    username: str,
    avatarUrl: Optional[str] = None,
) -> User:
    user = User(
        userId=userId,
        name=name,
        email=email,
        username=username,
        avatarUrl=avatarUrl,
        bio="",
        createdAt=now(),
        updatedAt=now(),
    )
    db.add(user)
    return user
