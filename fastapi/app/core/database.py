from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.async_session = None

    async def init(self):
        self.engine = create_async_engine(
            settings.NEON_DATABASE_URL,
            connect_args={"ssl": "require"},
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=True,
            echo=settings.DB_ECHO,
        )
        self.async_session = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    async def close(self):
        if self.engine:
            await self.engine.dispose()

    async def get_db(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()


db = DatabaseManager()