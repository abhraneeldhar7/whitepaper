from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.schema import EntityMembers, EntityType, MemberRole
from app.utils.helpers import now


async def _get_member(
    db: AsyncSession,
    workspaceId: str,
    entityId: str,
    userId: str,
) -> Optional[EntityMembers]:
    result = await db.execute(
        select(EntityMembers).where(
            EntityMembers.workspaceId == workspaceId,
            EntityMembers.entityId == entityId,
            EntityMembers.userId == userId,
        )
    )
    return result.scalar_one_or_none()


async def grant_access(
    db: AsyncSession,
    workspaceId: str,
    entityId: str,
    userId: str,
    entityType: EntityType ,
    role: MemberRole = MemberRole.viewer,
    grantedBySystem: bool = True,
    grantedById: Optional[str] = None,
) -> EntityMembers:
    existing = await _get_member(db, workspaceId, entityId, userId)
    if existing:
        return existing

    member = EntityMembers(
        workspaceId=workspaceId,
        entityId=entityId,
        userId=userId,
        entityType=entityType,
        role=role,
        grantedAt=now(),
        grantedBySystem=grantedBySystem,
        grantedById=grantedById,
    )
    db.add(member)
    return member


async def revoke_access(
    db: AsyncSession,
    workspaceId: str,
    entityId: str,
    userId: str,
) -> bool:
    existing = await _get_member(db, workspaceId, entityId, userId)
    if not existing:
        return False

    await db.delete(existing)
    return True
