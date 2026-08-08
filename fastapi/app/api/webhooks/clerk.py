from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from svix.webhooks import Webhook, WebhookVerificationError

from app.core.config import settings
from app.core.database import db
from app.services.user_service import delete_user

router = APIRouter()


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

    if event_type == "user.deleted":
        await handle_user_deleted(payload.get("data", {}), session)
        return {"status": "deleted"}

    return {"status": "ignored"}
