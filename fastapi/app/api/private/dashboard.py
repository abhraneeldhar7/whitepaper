from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.access_control import (
    get_workspace_members,
    get_user_all_workspaces,
    list_accessible_items,
)
from app.shared.schema import (
    Collection,
    Paper,
    Project,
)

router = APIRouter(prefix="/dashboard")


async def _fetch_accessible_entities(
    db: AsyncSession,
    auth: VerifiedRequest,
    workspaceId: str,
    context_type: str,
    context_id: str,
    target_type: str,
) -> list[dict]:
    accessible = await list_accessible_items(
        db, auth.roles, context_type, context_id, target_type
    )
    if not accessible:
        return []

    id_to_role = dict(accessible)
    entity_ids = list(id_to_role.keys())

    _MODEL = {"project": Project, "collection": Collection, "paper": Paper}
    _ID_ATTR = {"project": "projectId", "collection": "collectionId", "paper": "paperId"}

    model = _MODEL[target_type]
    id_attr = _ID_ATTR[target_type]

    result = await db.execute(
        select(model).where(getattr(model, id_attr).in_(entity_ids))
    )
    rows = result.scalars().all()

    return [
        {**row.model_dump(), "role": id_to_role[getattr(row, id_attr)]}
        for row in rows
    ]


@router.get("/projects")
async def dashboard_projects(
    workspaceId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> list[dict]:
    return await _fetch_accessible_entities(
        db=session,
        auth=auth,
        workspaceId=workspaceId,
        context_type="workspace",
        context_id=workspaceId,
        target_type="project",
    )


@router.get("/papers")
async def dashboard_papers(
    workspaceId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> list[dict]:
    return await _fetch_accessible_entities(
        db=session,
        auth=auth,
        workspaceId=workspaceId,
        context_type="workspace",
        context_id=workspaceId,
        target_type="paper",
    )


@router.get("/projects/{projectId}/collections")
async def project_collections(
    projectId: str,
    workspaceId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> list[dict]:
    return await _fetch_accessible_entities(
        db=session,
        auth=auth,
        workspaceId=workspaceId,
        context_type="project",
        context_id=projectId,
        target_type="collection",
    )


@router.get("/projects/{projectId}/papers")
async def project_papers(
    projectId: str,
    workspaceId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> list[dict]:
    return await _fetch_accessible_entities(
        db=session,
        auth=auth,
        workspaceId=workspaceId,
        context_type="project",
        context_id=projectId,
        target_type="paper",
    )


@router.get("/collections/{collectionId}/papers")
async def collection_papers(
    collectionId: str,
    workspaceId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> list[dict]:
    return await _fetch_accessible_entities(
        db=session,
        auth=auth,
        workspaceId=workspaceId,
        context_type="collection",
        context_id=collectionId,
        target_type="paper",
    )


@router.get("/members")
async def workspace_members(
    workspaceId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> list[dict]:
    return await get_workspace_members(session, workspaceId)


@router.get("/workspaces")
async def user_workspaces(
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> list[dict]:
    return await get_user_all_workspaces(session, auth.userId)
