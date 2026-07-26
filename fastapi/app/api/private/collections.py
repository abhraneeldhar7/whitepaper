from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.services.collection import get_collection_by_id
from app.shared.permissions import resolve_role_for_entity

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("/id")
async def get_collection(
    collectionId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> dict | None:
    collection = await get_collection_by_id(session, collectionId)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    role = resolve_role_for_entity(auth.roles, collection, "collection")
    if not role:
        raise HTTPException(status_code=403, detail="Access denied")

    return {**collection.model_dump(), "role": role}
