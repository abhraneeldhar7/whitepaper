from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.paper import get_paper_by_id, get_paper_by_slug
from app.services.access_control import check_access

router = APIRouter(prefix="/papers", tags=["papers"])


@router.get("/id/{paperId}")
async def get_paper_by_id_endpoint(
    paperId: str,
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    paper = await get_paper_by_id(session, paperId)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    roles = auth.roles if auth else []
    has_access, role = check_access(roles, paper, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"paper": paper, "role": role}


@router.get("/slug/{slug}")
async def get_paper_by_slug_endpoint(
    slug: str,
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    paper = await get_paper_by_slug(session, slug)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    roles = auth.roles if auth else []
    has_access, role = check_access(roles, paper, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"paper": paper, "role": role}
