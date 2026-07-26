from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.project import get_project_by_id
from app.services.access_control import check_access

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
async def get_project(
    projectId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> dict | None:
    project = await get_project_by_id(session, projectId)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    has_access, role = check_access(auth.roles, project, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"project": project, "role": role}
