import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.services.access_control import (
    get_entity_members,
    get_any_accessible_workspace,
    has_workspace_access,
)
from app.services.collection import get_collection_by_id
from app.services.project import get_project_by_id
from app.shared.schema import (
    Collection,
    EntityMembers,
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


async def get_oldest_owned_workspace(
    db: AsyncSession, userId: str
) -> str | None:
    result = await db.execute(
        select(EntityMembers.workspaceId).where(
            EntityMembers.userId == userId,
            EntityMembers.entityType == EntityType.workspace,
            EntityMembers.role == MemberRole.owner,
        ).order_by(EntityMembers.grantedAt.asc()).limit(1)
    )
    return result.scalar_one_or_none()


@dataclass
class DashboardResult:
    workspace: Workspace
    papers: list[Paper]
    projects: list[Project]
    workspace_role: MemberRole | None
    project_roles: dict[str, MemberRole]
    paper_roles: dict[str, MemberRole]


async def _load_workspace_data(
    db: AsyncSession, userId: str, workspaceId: str
) -> DashboardResult:
    """
    Fetch entity_members for the user in this workspace, then load data
    based on what the user has access to.

    - If entityType=workspace entry exists → user sees everything:
      all root papers + all projects.
    - If only entityType=project → show only those projects.
    - If entityType=paper or entityType=collection → resolve parent project,
      show those.
    """
    members = await get_entity_members(db, userId, workspaceId)

    has_workspace_access = any(
        m.entityType == EntityType.workspace for m in members
    )

    project_roles: dict[str, MemberRole] = {}
    paper_roles: dict[str, MemberRole] = {}

    if has_workspace_access:
        # Full workspace access — fetch everything at root level
        papers_result = await db.execute(
            select(Paper).where(
                Paper.workspaceId == workspaceId,
                Paper.projectId.is_(None),
                Paper.collectionId.is_(None),
            )
        )
        papers = list(papers_result.scalars().all())

        projects_result = await db.execute(
            select(Project).where(Project.workspaceId == workspaceId)
        )
        projects = list(projects_result.scalars().all())

        # Collect roles for projects and papers
        for m in members:
            if m.entityType == EntityType.project:
                project_roles[m.entityId] = m.role
            elif m.entityType == EntityType.paper:
                paper_roles[m.entityId] = m.role

        workspace_role = MemberRole.viewer
        for m in members:
            if m.entityType == EntityType.workspace:
                workspace_role = m.role
                break

        return DashboardResult(
            workspace=None,  # filled in by caller
            papers=papers,
            projects=projects,
            workspace_role=workspace_role,
            project_roles=project_roles,
            paper_roles=paper_roles,
        )

    # No workspace-level access — resolve from entity memberships
    target_project_ids: set[str] = set()
    target_paper_ids: set[str] = set()

    for m in members:
        if m.entityType == EntityType.project:
            target_project_ids.add(m.entityId)
            project_roles[m.entityId] = m.role
        elif m.entityType == EntityType.paper:
            target_paper_ids.add(m.entityId)
            paper_roles[m.entityId] = m.role
        elif m.entityType == EntityType.collection:
            coll_result = await db.execute(
                select(Collection.projectId).where(Collection.collectionId == m.entityId)
            )
            parent_project_id = coll_result.scalar_one_or_none()
            if parent_project_id:
                target_project_ids.add(parent_project_id)

    # For papers, resolve parent projects
    if target_paper_ids:
        papers_result = await db.execute(
            select(Paper).where(Paper.paperId.in_(target_paper_ids))
        )
        papers = list(papers_result.scalars().all())
        for p in papers:
            if p.projectId:
                target_project_ids.add(p.projectId)
    else:
        papers = []

    # Fetch target projects
    if target_project_ids:
        projects_result = await db.execute(
            select(Project).where(Project.projectId.in_(target_project_ids))
        )
        projects = list(projects_result.scalars().all())
    else:
        projects = []

    return DashboardResult(
        workspace=None,
        papers=papers,
        projects=projects,
        workspace_role=None,
        project_roles=project_roles,
        paper_roles=paper_roles,
    )


async def resolve_dashboard(
    db: AsyncSession,
    userId: str,
    workspace_id: str | None,
) -> dict:
    """
    Single entry point for the /dashboard screen.

    Algorithm:
    1. If workspace_id provided → use it (no questions asked per spec)
    2. If not → caller should have sent lastVisitedWorkspaceId from localStorage
       (we just receive whatever they send)
    3. Check access to selected workspaceId
    4. If blocked → fallback to oldest owned, then any accessible, then error
    5. If access OK → fetch all data and return

    Returns dict with either:
    - { workspaceId, papers, projects, workspace_role, project_roles, paper_roles }
    - { error, redirectTo } — frontend should show toast and redirect
    - { error } — no workspaces at all
    """
    # --- Step 1: Resolve workspaceId ---
    selected_id = requested_workspace_id

    # --- Step 2: Check access ---
    if selected_id:
        has_access = await has_workspace_access(db, userId, selected_id)
        if not has_access:
            # Access blocked — fallback per spec
            fallback_id = await get_oldest_owned_workspace(db, userId)
            if not fallback_id:
                fallback_id = await get_any_accessible_workspace(db, userId)

            if fallback_id:
                return {
                    "error": "You don't have access to this workspace. Redirecting to your default workspace...",
                    "redirectTo": fallback_id,
                }
            else:
                return {"error": "No workspaces available for this account"}

    # --- Step 3: If no workspaceId sent, find one ---
    if not selected_id:
        selected_id = await get_oldest_owned_workspace(db, userId)
        if not selected_id:
            selected_id = await get_any_accessible_workspace(db, userId)

        if not selected_id:
            return {"error": "No workspaces available for this account"}

    # --- Step 4: Fetch workspace + data ---
    workspace = await get_workspace_by_id(db, selected_id)
    if not workspace:
        return {"error": "Workspace not found", "code": 404}

    data = await _load_workspace_data(db, userId, selected_id)
    data.workspace = workspace

    return {
        "workspaceId": data.workspace.workspaceId,
        "workspace": {
            "workspaceId": data.workspace.workspaceId,
            "workspaceName": data.workspace.workspaceName,
            "workspaceSlug": data.workspace.workspaceSlug,
            "workspaceType": data.workspace.workspaceType,
            "plan": data.workspace.plan,
            "status": data.workspace.status,
        },
        "papers": [
            {
                "paperId": p.paperId,
                "title": p.title,
                "publicSlug": p.publicSlug,
                "thumbnailUrl": p.thumbnailUrl,
                "visibility": p.visibility,
                "projectId": p.projectId,
                "collectionId": p.collectionId,
                "createdAt": p.createdAt.isoformat(),
                "updatedAt": p.updatedAt.isoformat(),
            }
            for p in data.papers
        ],
        "projects": [
            {
                "projectId": pr.projectId,
                "name": pr.name,
                "publicSlug": pr.publicSlug,
                "description": pr.description,
                "logoUrl": pr.logoUrl,
                "visibility": pr.visibility,
                "createdAt": pr.createdAt.isoformat(),
                "updatedAt": pr.updatedAt.isoformat(),
            }
            for pr in data.projects
        ],
        "workspace_role": data.workspace_role,
        "project_roles": dict(data.project_roles),
        "paper_roles": dict(data.paper_roles),
    }


async def resolve_active_workspace(
    db: AsyncSession,
    userId: str,
    collectionId: str | None = None,
    projectId: str | None = None,
    workspaceId: str | None = None,
    lastVisitedWorkspaceId: str | None = None,
) -> dict:
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
        # Priority 1: closest to home
        result = await db.execute(
            select(EntityMembers.workspaceId).where(
                EntityMembers.userId == userId,
                EntityMembers.entityType == EntityType.workspace,
                EntityMembers.role == MemberRole.owner,
            ).order_by(EntityMembers.grantedAt.asc()).limit(1)
        )
        selected_workspace_id = result.scalar_one_or_none()

    if not selected_workspace_id:
        # Priority 2: any direct workspace membership
        result = await db.execute(
            select(EntityMembers.workspaceId).where(
                EntityMembers.userId == userId,
                EntityMembers.entityType == EntityType.workspace,
            ).order_by(EntityMembers.grantedAt.asc()).limit(1)
        )
        selected_workspace_id = result.scalar_one_or_none()

    if not selected_workspace_id:
        # Priority 3: any entity membership, get its workspaceId.
        result = await db.execute(
            select(EntityMembers.workspaceId).where(
                EntityMembers.userId == userId,
            ).order_by(EntityMembers.grantedAt.asc()).limit(1)
        )
        selected_workspace_id = result.scalar_one_or_none()

    if not selected_workspace_id:
        raise HTTPException(status_code=403, detail="no_workspace_available")

    workspace = await get_workspace_by_id(db, selected_workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="no_workspace_available")

    return workspace
