from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schema import Project


async def get_project_by_id(
    db: AsyncSession,
    projectId: str,
) -> Project | None:
    result = await db.execute(
        select(Project).where(Project.projectId == projectId)
    )
    return result.scalar_one_or_none()
