from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.collection import get_collection_by_id
from app.services.access_control import check_access

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("/")
async def get_collection(
    collectionId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> dict | None:
    collection = await get_collection_by_id(session, collectionId)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    has_access, role = check_access(auth.roles, collection, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"collection": collection, "role": role}
