from typing import Literal, TypeAlias

Role: TypeAlias = Literal["owner", "admin", "member", "viewer"]
EntityType: TypeAlias = Literal["workspace", "project", "collection", "paper"]
Action: TypeAlias = Literal[
    "view", "edit", "delete",
    "create",
    "add_members", "remove_members",
]

ROLE_PERMISSIONS: dict[EntityType, dict[Role, set[Action]]] = {
    "workspace": {
        "owner":  {"view", "edit", "delete", "create", "add_members", "remove_members"},
        "admin":  {"view", "edit", "create", "add_members", "remove_members"},
        "member": {"view", "create"},
        "viewer": {"view"},
    },
    "project": {
        "owner":  {"view", "edit", "delete", "create", "add_members", "remove_members"},
        "admin":  {"view", "edit", "create", "add_members", "remove_members"},
        "member": {"view", "edit", "create"},
        "viewer": {"view"},
    },
    "collection": {
        "owner":  {"view", "edit", "delete", "create", "add_members", "remove_members"},
        "admin":  {"view", "edit", "create", "add_members", "remove_members"},
        "member": {"view", "edit", "create"},
        "viewer": {"view"},
    },
    "paper": {
        "owner":  {"view", "edit", "delete"},
        "admin":  {"view", "edit"},
        "member": {"view", "edit"},
        "viewer": {"view"},
    },
}

ENTITY_ROLES: dict[EntityType, set[Role]] = {
    entity: set(perms.keys())
    for entity, perms in ROLE_PERMISSIONS.items()
}
