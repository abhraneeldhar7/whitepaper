import uuid

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schema import Project, Visibility
from app.utils.helpers import now


async def get_project_by_id(
    db: AsyncSession,
    projectId: str,
) -> Project | None:
    result = await db.execute(
        select(Project).where(Project.projectId == projectId)
    )
    return result.scalar_one_or_none()


async def get_project_by_slug(
    db: AsyncSession,
    workspaceId: str,
    slug: str,
) -> Project | None:
    result = await db.execute(
        select(Project).where(
            Project.workspaceId == workspaceId,
            Project.publicSlug == slug,
        )
    )
    return result.scalar_one_or_none()


async def project_slug_exists_in_workspace(
    db: AsyncSession,
    workspaceId: str,
    slug: str,
) -> bool:
    result = await db.execute(
        select(Project).where(
            Project.workspaceId == workspaceId,
            Project.publicSlug == slug,
        )
    )
    return result.scalar_one_or_none() is not None


async def get_project_count_in_workspace(
    db: AsyncSession,
    workspaceId: str,
) -> int:
    result = await db.execute(
        select(func.count()).select_from(
            select(Project).where(Project.workspaceId == workspaceId).subquery()
        )
    )
    return result.scalar_one()


async def create_project(
    db: AsyncSession,
    workspaceId: str,
    name: str,
    publicSlug: str,
    description: str,
    visibility: Visibility,
    projectId: Optional[str] = None,
    logoUrl: Optional[str] = None,
    bannerUrl: Optional[str] = None,
) -> Project:
    project = Project(
        workspaceId=workspaceId,
        projectId=projectId or uuid.uuid4().hex,
        name=name,
        publicSlug=publicSlug,
        description=description,
        logoUrl=logoUrl,
        bannerUrl=bannerUrl,
        visibility=visibility,
        createdAt=now(),
        updatedAt=now(),
    )
    db.add(project)
    return project
