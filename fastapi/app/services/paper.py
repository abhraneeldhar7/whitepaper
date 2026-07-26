from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schema import Paper


async def get_paper_by_id(
    db: AsyncSession,
    paperId: str,
) -> Paper | None:
    result = await db.execute(
        select(Paper).where(Paper.paperId == paperId)
    )
    return result.scalar_one_or_none()
