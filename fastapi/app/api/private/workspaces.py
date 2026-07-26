from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.access_control import get_user_workspaces
from app.services.workspace import resolve_dashboard, resolve_active_workspace

router = APIRouter(prefix="/workspaces")


@router.get("/list")
async def list_workspaces(
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> list[dict]:
    return await get_user_workspaces(session, auth.userId)


@router.get("/active")
async def workspace_active(
    workspaceId: Optional[str] = Query(None),
    projectId: Optional[str] = Query(None),
    collectionId: Optional[str] = Query(None),
    lastVisitedWorkspaceId: Optional[str] = Query(None),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> dict:
    return await resolve_active_workspace(
        session, auth.userId,
        collectionId=collectionId,
        projectId=projectId,
        workspaceId=workspaceId,
        lastVisitedWorkspaceId=lastVisitedWorkspaceId,
    )


@router.get("/resolve-dashboard")
async def dashboard_resolve(
    workspaceId: Optional[str] = Query(None),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> dict:
    return await resolve_dashboard(session, auth.userId, workspaceId)
