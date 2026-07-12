from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import clerk_client
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


async def _fetch_clerk_roles(user_id: str) -> list[dict[str, str]]:
    user = await clerk_client.users.get_async(user_id=user_id)
    metadata = user.public_metadata or {}
    return metadata.get("roles", [])


async def _push_clerk_roles(user_id: str, roles: list[dict[str, str]]) -> None:
    await clerk_client.users.update_metadata_async(
        user_id=user_id,
        public_metadata={"roles": roles},
    )


def _role_key(role: str, entityId: str) -> tuple[str, str]:
    return (role, entityId)


async def grant_access(
    db: AsyncSession,
    workspaceId: str,
    entityId: str,
    userId: str,
    entityType: EntityType,
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

    clerk_roles = await _fetch_clerk_roles(userId)
    new_entry = {"role": role.value, "entityId": entityId}
    key = _role_key(role.value, entityId)
    if not any(_role_key(r["role"], r["entityId"]) == key for r in clerk_roles):
        clerk_roles.append(new_entry)
        await _push_clerk_roles(userId, clerk_roles)

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

    clerk_roles = await _fetch_clerk_roles(userId)
    key = _role_key(existing.role.value, existing.entityId)
    clerk_roles = [r for r in clerk_roles if _role_key(r["role"], r["entityId"]) != key]
    await _push_clerk_roles(userId, clerk_roles)

    return True
