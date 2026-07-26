from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db as db_module
from app.core.security import get_verified_request, VerifiedRequest
from app.services.access_control import list_accessible_items, AccessibleItems

router = APIRouter(prefix="/screen")


@router.get("/workspace")
async def screen_workspace(
    workspaceId: str = Query(...),
    db: AsyncSession = Depends(db_module.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> AccessibleItems:
    return await list_accessible_items(db, auth.roles, "workspace", workspaceId)


@router.get("/project")
async def screen_project(
    projectId: str = Query(...),
    db: AsyncSession = Depends(db_module.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> AccessibleItems:
    return await list_accessible_items(db, auth.roles, "project", projectId)


@router.get("/collection")
async def screen_collection(
    collectionId: str = Query(...),
    db: AsyncSession = Depends(db_module.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> AccessibleItems:
    return await list_accessible_items(db, auth.roles, "collection", collectionId)
