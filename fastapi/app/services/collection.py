from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schema import Collection


async def get_collection_by_id(
    db: AsyncSession,
    collectionId: str,
) -> Collection | None:
    result = await db.execute(
        select(Collection).where(Collection.collectionId == collectionId)
    )
    return result.scalar_one_or_none()
