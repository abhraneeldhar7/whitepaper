import random
import string
from typing import Any

from clerk_backend_api import ClerkBaseError
from app.shared.schema import MemberRole, EntityType
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from svix.webhooks import Webhook, WebhookVerificationError

from app.core.config import settings
from app.core.database import db
from app.core.security import clerk_client
from app.services.access_control import grant_access
from app.services.user_service import (
    create_user,
    delete_user,
    get_user_by_id,
    username_exists,
)
from app.services.workspace_service import (
    create_personal_workspace,
    workspace_slug_exists,
)

router = APIRouter()


def _get_name(data: dict[str, Any]) -> str:
    first = data.get("first_name", "")
    last = data.get("last_name", "")
    return f"{first} {last}".strip() or "Unnamed"


def _get_email(data: dict[str, Any]) -> str:
    emails = data.get("email_addresses", [])
    return emails[0]["email_address"] if emails else ""


async def _generate_username(db: AsyncSession, email: str) -> str:
    base = email.split("@")[0]
    username = base
    while await username_exists(db, username):
        username = base + "".join(random.choices(string.ascii_lowercase, k=4))
    return username


async def _generate_workspace_slug(db: AsyncSession, base: str) -> str:
    slug = base
    while await workspace_slug_exists(db, slug):
        slug = base + "".join(random.choices(string.ascii_lowercase, k=4))
    return slug


async def handle_user_created(data: dict[str, Any], session: AsyncSession) -> None:
    clerk_user_id = data.get("id")
    if not clerk_user_id:
        return

    try:
        await clerk_client.users.get_async(user_id=clerk_user_id)
    except ClerkBaseError as e:
        if e.status_code == 404:
            return
        raise

    existing = await get_user_by_id(session, clerk_user_id)
    if existing:
        return

    name = _get_name(data)
    email = _get_email(data)
    avatar_url = data.get("image_url")
    username = await _generate_username(session, email)
    workspaceSlug = await _generate_workspace_slug(session, username)

    await create_user(
        db=session,
        userId=clerk_user_id,
        name=name,
        email=email,
        username=username,
        avatarUrl=avatar_url,
    )

    workspace = await create_personal_workspace(
        db=session,
        ownerId=clerk_user_id,
        workspaceName=f"{name}'s Workspace",
        workspaceSlug=workspaceSlug,
    )

    await grant_access(
        db=session,
        workspaceId=workspace.workspaceId,
        entityId=workspace.workspaceId,
        entityType= EntityType.workspace,
        role=MemberRole.owner,
        userId=clerk_user_id,
    )


async def handle_user_deleted(data: dict[str, Any], session: AsyncSession) -> None:
    clerk_user_id = data.get("id")
    if not clerk_user_id:
        return

    await delete_user(session, clerk_user_id)


@router.post("/clerk")
async def clerk_webhook(
    request: Request,
    session: AsyncSession = Depends(db.get_db),
) -> dict[str, str]:
    body = await request.body()
    headers = {
        "svix-id": request.headers.get("svix-id", ""),
        "svix-timestamp": request.headers.get("svix-timestamp", ""),
        "svix-signature": request.headers.get("svix-signature", ""),
    }

    wh = Webhook(settings.CLERK_WEBHOOK_SIGNING_SECRET)
    try:
        payload = wh.verify(body, headers)
    except WebhookVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    event_type = payload.get("type")

    if event_type == "user.created":
        await handle_user_created(payload.get("data", {}), session)
        return {"status": "created"}

    if event_type == "user.deleted":
        await handle_user_deleted(payload.get("data", {}), session)
        return {"status": "deleted"}

    return {"status": "ignored"}
