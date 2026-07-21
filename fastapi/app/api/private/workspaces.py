from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.workspace_service import resolve_dashboard

router = APIRouter(prefix="/workspaces")


@router.get("/resolve-dashboard")
async def dashboard_resolve(
    workspaceId: Optional[str] = Query(None),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> dict:
    return await resolve_dashboard(session, auth.userId, workspaceId)
