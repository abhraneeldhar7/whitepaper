from dataclasses import dataclass, field
from typing import Any

from clerk_backend_api import AuthenticateRequestOptions, Clerk
from fastapi import HTTPException, Request

from app.core.config import settings
from app.shared.schema import ClerkUserRole

clerk_client = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)


def _auth_options() -> AuthenticateRequestOptions:
    parties = [p.strip() for p in settings.CLERK_AUTHORIZED_PARTIES.split(",") if p.strip()]
    return AuthenticateRequestOptions(
        authorized_parties=parties,
        jwt_key=settings.CLERK_JWT_KEY,
    )


@dataclass
class VerifiedRequest:
    userId: str
    roles: list[ClerkUserRole] = field(default_factory=list)


async def get_verified_request(request: Request) -> VerifiedRequest:
    request_state = clerk_client.authenticate_request(request, _auth_options())

    if not request_state.is_signed_in:
        detail = request_state.message or "Invalid token"
        raise HTTPException(status_code=401, detail=detail)

    payload = request_state.payload or {}
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="No user ID in token")

    raw_roles: list[dict[str, str]] = payload.get("metadata", {}).get("roles", [])
    roles = [ClerkUserRole(role=r["role"], entityId=r["entityId"], entityType=r["entityType"]) for r in raw_roles]

    return VerifiedRequest(userId=user_id, roles=roles)
