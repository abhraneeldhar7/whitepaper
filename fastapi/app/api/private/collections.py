from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.collection import get_collection_by_id, get_collection_by_slug
from app.services.access_control import check_access

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("/id/{collectionId}")
async def get_collection_by_id_endpoint(
    collectionId: str,
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    collection = await get_collection_by_id(session, collectionId)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    roles = auth.roles if auth else []
    has_access, role = check_access(roles, collection, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"collection": collection, "role": role}


@router.get("/slug/{slug}")
async def get_collection_by_slug_endpoint(
    slug: str,
    projectId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    collection = await get_collection_by_slug(session, projectId, slug)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    roles = auth.roles if auth else []
    has_access, role = check_access(roles, collection, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"collection": collection, "role": role}
