import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.services.collection import get_collection_by_id
from app.services.project import get_project_by_id
from app.shared.schema import (
    ClerkUserRole,
    Collection,
    EntityType,
    MemberRole,
    Paper,
    Plan,
    Project,
    Workspace,
    WorkspaceStatus,
    WorkspaceType,
)
from app.utils.helpers import now


async def workspace_slug_exists(db: AsyncSession, slug: str) -> bool:
    result = await db.execute(select(Workspace).where(Workspace.workspaceSlug == slug))
    return result.scalar_one_or_none() is not None


async def get_workspace_by_id(
    db: AsyncSession,
    workspaceId: str,
) -> Workspace | None:
    result = await db.execute(
        select(Workspace).where(Workspace.workspaceId == workspaceId)
    )
    return result.scalar_one_or_none()


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


async def get_user_workspaces(
    db: AsyncSession, roles: list[ClerkUserRole]
):
    workspace_ids = {r.workspaceId for r in roles}
    if not workspace_ids:
        return []

    workspaces = (await db.execute(
        select(Workspace).where(Workspace.workspaceId.in_(workspace_ids))
    )).scalars().all()

    return workspaces



async def resolve_active_workspace(
    db: AsyncSession,
    roles: list[ClerkUserRole],
    collectionId: str | None = None,
    projectId: str | None = None,
    workspaceId: str | None = None,
    lastVisitedWorkspaceId: str | None = None,
):
    """
    Resolve the active workspace for the current user depending on what screen.

    Priority order:
      1. workspaceId (queryParam, explicit) → hard fail if not found
      2. collectionId → fetch entity and extract workspaceId
      3. projectId → fetch entity and extract workspaceId
      4. lastVisitedWorkspaceId (localStorage, stale) → soft fail, fall through
      5. entity_members fallback: owner workspace → any workspace → any entity → 403
    """
    selected_workspace_id = None

    if workspaceId:
        workspace = await get_workspace_by_id(db, workspaceId)
        if not workspace:
            raise HTTPException(status_code=404, detail="workspace_not_found")
        selected_workspace_id = workspaceId

    if not selected_workspace_id and collectionId:
        collection = await get_collection_by_id(db, collectionId)
        if collection:
            selected_workspace_id = collection.workspaceId

    if not selected_workspace_id and projectId:
        project = await get_project_by_id(db, projectId)
        if project:
            selected_workspace_id = project.workspaceId

    if not selected_workspace_id and lastVisitedWorkspaceId:
        workspace = await get_workspace_by_id(db, lastVisitedWorkspaceId)
        if workspace:
            selected_workspace_id = lastVisitedWorkspaceId

    if not selected_workspace_id:
        workspace_roles = sorted(
            (r for r in roles if r.entityType == "workspace"),
            key=lambda r: r.grantedAt,
        )
        owner = next((r for r in workspace_roles if r.role == "owner"), None)
        if owner:
            selected_workspace_id = owner.workspaceId

    if not selected_workspace_id:
        workspace_roles = sorted(
            (r for r in roles if r.entityType == "workspace"),
            key=lambda r: r.grantedAt,
        )
        if workspace_roles:
            selected_workspace_id = workspace_roles[0].workspaceId

    if not selected_workspace_id:
        all_roles = sorted(roles, key=lambda r: r.grantedAt)
        if all_roles:
            selected_workspace_id = all_roles[0].workspaceId

    if not selected_workspace_id:
        raise HTTPException(status_code=403, detail="no_workspace_available")

    workspace = await get_workspace_by_id(db, selected_workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="no_workspace_available")

    return workspace
