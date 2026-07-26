from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.paper import get_paper_by_id
from app.services.access_control import check_access

router = APIRouter(prefix="/papers", tags=["papers"])


@router.get("/id")
async def get_paper(
    paperId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> dict | None:
    paper = await get_paper_by_id(session, paperId)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    has_access, role = check_access(auth.roles, paper, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"paper": paper, "role": role}
