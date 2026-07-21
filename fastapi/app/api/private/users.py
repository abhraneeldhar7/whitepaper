from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import get_verified_request, VerifiedRequest
from app.shared.schema import User
from app.services.user_service import get_user_by_id

router = APIRouter(prefix="/users")


@router.get("/me")
async def get_me(
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest = Depends(get_verified_request),
) -> User | None:
    return await get_user_by_id(session, auth.userId)
