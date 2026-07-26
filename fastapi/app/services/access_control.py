from dataclasses import dataclass
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import clerk_client
from app.shared.constants import MAX_ROLES_PER_USER
from app.shared.permissions import ROLE_PERMISSIONS
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



from app.services.collection import get_collection_by_id
from app.services.paper import get_paper_by_id
from app.services.project import get_project_by_id
from app.services.workspace import get_workspace_by_id







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

_CHILD_TO_ENTITY: dict[str, str] = {
    "projects": "project",
    "papers": "paper",
    "collections": "collection",
}

_DIRECT_RULES: dict[tuple[str, str], tuple] = {
    ("workspace", "project"): (Project.workspaceId, []),
    ("workspace", "paper"): (Paper.workspaceId, [Paper.projectId.is_(None), Paper.collectionId.is_(None)]),
    ("project", "collection"): (Collection.projectId, []),
    ("project", "paper"): (Paper.projectId, [Paper.collectionId.is_(None)]),
    ("collection", "paper"): (Paper.collectionId, []),
}

_DERIVED_RULES: dict[str, list[tuple]] = {
    "workspace": [
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
            lambda ctx_id: Paper.projectId.isnot(None) & Paper.projectId.in_(
                select(Project.projectId).where(Project.workspaceId == ctx_id)
            ),
        ),
    ],
    "project": [
        (
            "paper",
            Paper.collectionId,
            lambda ctx_id: Paper.collectionId.isnot(None) & Paper.collectionId.in_(
                select(Collection.collectionId).where(Collection.projectId == ctx_id)
            ),
        ),
    ],
}






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


async def _fetch_clerk_roles(user_id: str) -> list[dict]:
    user = await clerk_client.users.get_async(user_id=user_id)
    metadata = user.public_metadata or {}
    return metadata.get("roles", [])


async def _update_clerk_roles(user_id: str, roles: list[dict]) -> None:
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



def can(role: str, entity_type: str, action: str) -> bool:
    entity_perms = ROLE_PERMISSIONS.get(entity_type)
    if not entity_perms:
        return False
    return action in entity_perms.get(role, set())



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
    new_entry = {
        "workspaceId": member.workspaceId,
        "entityId": member.entityId,
        "userId": member.userId,
        "entityType": member.entityType.value,
        "role": member.role.value,
        "grantedAt": member.grantedAt.isoformat(),
        "grantedBySystem": member.grantedBySystem,
        "grantedById": member.grantedById,
    }
    key = _role_key(member.role.value, member.entityId)
    if not any(_role_key(r["role"], r["entityId"]) == key for r in clerk_roles):
        clerk_roles.append(new_entry)
        await _update_clerk_roles(userId, clerk_roles)

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
    await _update_clerk_roles(userId, clerk_roles)

    return True


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


@dataclass
class AccessibleItem:
    role: str
    data: Project | Paper | Collection


@dataclass
class AccessibleItems:
    projects: list[AccessibleItem] | None
    papers: list[AccessibleItem] | None
    collections: list[AccessibleItem] | None


async def list_accessible_items(
    db: AsyncSession,
    rolesList: list[ClerkUserRole],
    context_type: str,
    context_id: str
) -> AccessibleItems:
    
    children_map = {
        "workspace": ["projects", "papers"],
        "project": ["collections", "papers"],
        "collection": ["papers"],
    }
    
    children = children_map.get(context_type, [])
    result = AccessibleItems(projects=None, papers=None, collections=None)
    

    
    #  phase A: top-down derived access
    chain = _PARENT_CHAIN.get(context_type)
    if not chain:
        return result
 
    direct_role = None
    for r in rolesList:
        if r.entityId == context_id and r.entityType == context_type:
            direct_role = r.role
            break

    if not direct_role:
        if context_type == "workspace":
            entity = await get_workspace_by_id(db, context_id)
        elif context_type == "project":
            entity = await get_project_by_id(db, context_id)
        elif context_type == "collection":
            entity = await get_collection_by_id(db, context_id)
        elif context_type == "paper":
            entity = await get_paper_by_id(db, context_id)
            # paper condition will never be used but all the clankers are writing it...
        else:
            entity = None
        if entity:
            for attr_name, etype in chain:
                eid = getattr(entity, attr_name, None)
                if eid is None:
                    continue
                for r in rolesList:
                    if r.entityId == eid and r.entityType == etype:
                        direct_role = r.role
                        break
                if direct_role:
                    break
    
    if not direct_role:
        return result
    
    result_map: dict[str, dict[str, AccessibleItem]] = {k: {} for k in children}
    
    for child_key in children:
        child_type = _CHILD_TO_ENTITY[child_key]
        fk, filters = _DIRECT_RULES[(context_type, child_type)]
        rows = (await db.execute(
            select(_ENTITY_MODEL[child_type]).where(fk == context_id, *filters)
        )).scalars().all()
        
        for row in rows:
            eid = getattr(row, _ENTITY_ID_ATTR[child_type])
            role = resolve_role_for_entity(rolesList, row, child_type)
            result_map[child_key][eid] = AccessibleItem(role=role or direct_role, data=row)
    # phase A end
    
    
    
    # phase B: bottom-up bloodline finding
    derived_rules = _DERIVED_RULES.get(context_type, [])
    for desc_type, rollup_field, context_check in derived_rules:
        desc_ids = [r.entityId for r in rolesList if r.entityType == desc_type]
        if not desc_ids:
            continue
        
        desc_model = _ENTITY_MODEL[desc_type]
        desc_id_attr = _ENTITY_ID_ATTR[desc_type]
        
        parent_ids_query = (
            select(rollup_field)
            .distinct()
            .where(
                rollup_field.isnot(None),
                getattr(desc_model, desc_id_attr).in_(desc_ids),
                context_check(context_id),
            )
        )
        parent_ids = (await db.execute(parent_ids_query)).scalars().all()
        
        if not parent_ids:
            continue
        
        if rollup_field is Collection.projectId or rollup_field is Paper.projectId:
            target_child_key = "projects" if "projects" in children else None
            target_type = "project"
        elif rollup_field is Paper.collectionId:
            target_child_key = "collections" if "collections" in children else None
            target_type = "collection"
        else:
            continue
        
        if not target_child_key:
            continue
        
        existing_ids = set(result_map[target_child_key].keys())
        new_ids = [pid for pid in parent_ids if pid not in existing_ids]
        
        if not new_ids:
            continue
        
        target_model = _ENTITY_MODEL[target_type]
        target_id_attr = _ENTITY_ID_ATTR[target_type]
        
        entities = (await db.execute(
            select(target_model).where(
                getattr(target_model, target_id_attr).in_(new_ids)
            )
        )).scalars().all()
        
        for ent in entities:
            eid = getattr(ent, target_id_attr)
            result_map[target_child_key][eid] = AccessibleItem(role="viewer", data=ent)
    
    for child_key in children:
        items = list(result_map[child_key].values())
        setattr(result, child_key, items if items else None)
    
    return result
