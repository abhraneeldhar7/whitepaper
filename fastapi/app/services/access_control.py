from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import clerk_client
from app.shared.constants import MAX_ROLES_PER_USER
from app.shared.permissions import ENTITY_ROLES, ROLE_PERMISSIONS
from app.shared.schema import (
    ClerkUserRole,
    Collection,
    EntityMembers,
    EntityType,
    MemberRole,
    Paper,
    Project,
    Visibility,
    Workspace,
)
from app.utils.helpers import now


# ── Permission check ──


def can(role: str, entity_type: str, action: str) -> bool:
    entity_perms = ROLE_PERMISSIONS.get(entity_type)
    if not entity_perms:
        return False
    return action in entity_perms.get(role, set())


# ── Lookup tables ──

_ENTITY_TYPE_MAP: dict[type, str] = {
    Workspace: "workspace",
    Project: "project",
    Collection: "collection",
    Paper: "paper",
}

_PARENT_CHAIN: dict[str, list[tuple[str, str]]] = {
    "workspace": [("workspaceId", "workspace")],
    "project": [("projectId", "project"), ("workspaceId", "workspace")],
    "collection": [("collectionId", "collection"), ("projectId", "project"), ("workspaceId", "workspace")],
    "paper": [("paperId", "paper"), ("collectionId", "collection"), ("projectId", "project"), ("workspaceId", "workspace")],
}

_ENTITY_MODEL: dict[str, type] = {
    "workspace": Workspace,
    "project": Project,
    "collection": Collection,
    "paper": Paper,
}

_ENTITY_ID_ATTR: dict[str, str] = {
    "workspace": "workspaceId",
    "project": "projectId",
    "collection": "collectionId",
    "paper": "paperId",
}

_DIRECT_RULES: dict[tuple[str, str], tuple] = {
    ("workspace", "project"): (Project.workspaceId, []),
    ("workspace", "paper"): (Paper.workspaceId, [Paper.projectId.is_(None), Paper.collectionId.is_(None)]),
    ("project", "collection"): (Collection.projectId, []),
    ("project", "paper"): (Paper.projectId, [Paper.collectionId.is_(None)]),
    ("collection", "paper"): (Paper.collectionId, []),
}

_DERIVED_RULES: dict[str, list[tuple]] = {
    "project": [
        (
            "collection",
            Collection.projectId,
            lambda ctx_id: Collection.projectId.in_(
                select(Project.projectId).where(Project.workspaceId == ctx_id)
            ),
        ),
        (
            "paper",
            Paper.projectId,
            lambda ctx_id: Paper.projectId.in_(
                select(Project.projectId).where(Project.workspaceId == ctx_id)
            ),
        ),
    ],
    "collection": [
        (
            "paper",
            Paper.collectionId,
            lambda ctx_id: Paper.collectionId.in_(
                select(Collection.collectionId).where(Collection.projectId == ctx_id)
            ),
        ),
    ],
}


# ── Existing helpers ──


async def _get_existing_role(
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


async def _get_user_roles_count(db: AsyncSession, userId: str) -> int:
    result = await db.execute(
        select(func.count()).select_from(
            select(EntityMembers)
            .where(EntityMembers.userId == userId)
            .subquery()
        )
    )
    return result.scalar_one()


def _validate_role(entityType: EntityType, role: MemberRole) -> None:
    valid_roles = ENTITY_ROLES.get(entityType.value)
    if not valid_roles or role.value not in valid_roles:
        raise ValueError(f"Role '{role.value}' is not valid for entity type '{entityType.value}'")


# ── Workspace access helpers ──


async def has_workspace_access(
    db: AsyncSession, userId: str, workspaceId: str
) -> bool:
    result = await db.execute(
        select(EntityMembers).where(
            EntityMembers.userId == userId,
            EntityMembers.workspaceId == workspaceId,
            EntityMembers.entityType == EntityType.workspace,
        )
    )
    return result.scalar_one_or_none() is not None


async def get_oldest_owned_workspace(
    db: AsyncSession, userId: str
) -> str | None:
    result = await db.execute(
        select(EntityMembers.workspaceId).where(
            EntityMembers.userId == userId,
            EntityMembers.entityType == EntityType.workspace,
            EntityMembers.role == MemberRole.owner,
        ).order_by(EntityMembers.grantedAt.asc()).limit(1)
    )
    return result.scalar_one_or_none()


async def get_any_accessible_workspace(
    db: AsyncSession, userId: str
) -> str | None:
    result = await db.execute(
        select(EntityMembers.workspaceId).where(
            EntityMembers.userId == userId,
            EntityMembers.entityType == EntityType.workspace,
        ).limit(1)
    )
    return result.scalar_one_or_none()


async def get_entity_members(
    db: AsyncSession, userId: str, workspaceId: str
) -> list[EntityMembers]:
    result = await db.execute(
        select(EntityMembers).where(
            EntityMembers.userId == userId,
            EntityMembers.workspaceId == workspaceId,
        )
    )
    return list(result.scalars().all())


# ── Access grant / revoke ──


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
    _validate_role(entityType, role)

    existing = await _get_existing_role(db, workspaceId, entityId, userId)
    if existing:
        return existing

    count = await _get_user_roles_count(db, userId)
    if count >= MAX_ROLES_PER_USER:
        raise ValueError(f"User has reached the maximum of {MAX_ROLES_PER_USER} roles")

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
    new_entry = {"role": role.value, "entityId": entityId, "entityType": entityType.value}
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
    existing = await _get_existing_role(db, workspaceId, entityId, userId)
    if not existing:
        return False

    await db.delete(existing)

    clerk_roles = await _fetch_clerk_roles(userId)
    key = _role_key(existing.role.value, existing.entityId)
    clerk_roles = [r for r in clerk_roles if _role_key(r["role"], r["entityId"]) != key]
    await _push_clerk_roles(userId, clerk_roles)

    return True


# ── Role resolution ──


def resolve_role_for_entity(
    rolesList: list[ClerkUserRole],
    entity: Workspace | Project | Collection | Paper,
    entityType: str,
) -> Optional[str]:
    chain = _PARENT_CHAIN.get(entityType)
    if not chain:
        return None

    role_index = {(r.entityId, r.entityType): r.role for r in rolesList}

    for attr_name, etype in chain:
        eid = getattr(entity, attr_name, None)
        if eid is None:
            continue
        role = role_index.get((eid, etype))
        if role:
            return role

    if getattr(entity, "visibility", None) == Visibility.public:
        return "viewer"

    return None


def check_access(
    rolesList: list[ClerkUserRole],
    entity: Workspace | Project | Collection | Paper,
    action: str,
) -> tuple[bool, Optional[str]]:
    entity_type = _ENTITY_TYPE_MAP.get(type(entity))
    if entity_type is None:
        return (False, None)

    role = resolve_role_for_entity(rolesList, entity, entity_type)
    if role is None:
        return (False, None)

    return (can(role, entity_type, action), role)


async def list_accessible_items(
    db: AsyncSession,
    rolesList: list[ClerkUserRole],
    context_type: str,
    context_id: str,
    target_type: str,
) -> list[tuple[str, str]]:
    result: dict[str, str] = {}

    # Phase A — Direct matches
    claim_ids = [r.entityId for r in rolesList if r.entityType == target_type]
    if claim_ids:
        model = _ENTITY_MODEL[target_type]
        id_attr = _ENTITY_ID_ATTR[target_type]
        filter_field, extra = _DIRECT_RULES[(context_type, target_type)]

        stmt = select(model).where(
            getattr(model, id_attr).in_(claim_ids),
            filter_field == context_id,
            *extra,
        )
        rows = (await db.execute(stmt)).scalars().all()

        role_index = {(r.entityId, r.entityType): r.role for r in rolesList}
        for row in rows:
            eid = getattr(row, id_attr)
            result[eid] = role_index.get((eid, target_type), "viewer")

    # Phase B — Derived matches (bottom-up rollup)
    for desc_type, rollup_field, context_check in _DERIVED_RULES.get(target_type, []):
        desc_ids = [r.entityId for r in rolesList if r.entityType == desc_type]
        if not desc_ids:
            continue

        desc_model = _ENTITY_MODEL[desc_type]
        desc_id_attr = _ENTITY_ID_ATTR[desc_type]

        stmt = select(rollup_field.distinct()).where(
            getattr(desc_model, desc_id_attr).in_(desc_ids),
            rollup_field.isnot(None),
            context_check(context_id),
        )
        parent_ids = (await db.execute(stmt)).scalars().all()

        for pid in parent_ids:
            if pid is not None and pid not in result:
                result[pid] = "viewer"

    return list(result.items())
