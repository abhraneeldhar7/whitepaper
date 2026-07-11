import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.schema import Plan, Workspace, WorkspaceStatus, WorkspaceType
from app.utils.helpers import now


async def workspace_slug_exists(db: AsyncSession, slug: str) -> bool:
    result = await db.execute(select(Workspace).where(Workspace.workspaceSlug == slug))
    return result.scalar_one_or_none() is not None


async def create_personal_workspace(
    db: AsyncSession,
    ownerId: str,
    workspaceName: str,
    workspaceSlug: str,
) -> Workspace:
    workspace = Workspace(
        ownerId=ownerId,
        workspaceId=uuid.uuid4().hex,
        workspaceSlug=workspaceSlug,
        workspaceType=WorkspaceType.personal,
        workspaceName=workspaceName,
        plan=Plan.free,
        status=WorkspaceStatus.active,
        createdAt=now(),
        updatedAt=now(),
    )
    db.add(workspace)
    return workspace
