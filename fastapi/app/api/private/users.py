from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db
from app.core.security import clerk_client, get_verified_request, VerifiedRequest
from app.services.access_control import grant_access
from app.services.user_service import create_user, generate_username, get_user_by_id
from app.services.workspace import create_personal_workspace, generate_workspace_slug
from app.shared.schema import EntityType, MemberRole, User

router = APIRouter(prefix="/users")


@router.get("/me")
async def get_me(
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> User | None:
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await get_user_by_id(session, auth.userId)


@router.post("/provision")
async def provision_user(
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    existing = await get_user_by_id(session, auth.userId)
    if existing:
        user = await clerk_client.users.get_async(user_id=auth.userId)
        metadata = user.public_metadata or {}
        metadata["isOnboardingComplete"] = True
        await clerk_client.users.update_metadata_async(
            user_id=auth.userId,
            public_metadata=metadata,
        )
        return {"status": "already_provisioned"}

    clerk_user = await clerk_client.users.get_async(user_id=auth.userId)
    primary_email = next(
        (e.email_address for e in (clerk_user.email_addresses or [])
         if e.id == clerk_user.primary_email_address_id),
        clerk_user.email_addresses[0].email_address if clerk_user.email_addresses else "",
    )
    name = f"{clerk_user.first_name or ''} {clerk_user.last_name or ''}".strip() or "Unnamed"
    email = primary_email
    avatar_url = clerk_user.image_url
    username = await generate_username(session, email)
    workspace_slug = await generate_workspace_slug(session, username)

    await create_user(
        db=session,
        userId=auth.userId,
        name=name,
        email=email,
        username=username,
        avatarUrl=avatar_url,
    )

    workspace = await create_personal_workspace(
        db=session,
        ownerId=auth.userId,
        workspaceName=f"{name}'s Workspace",
        workspaceSlug=workspace_slug,
    )

    await grant_access(
        db=session,
        workspaceId=workspace.workspaceId,
        entityId=workspace.workspaceId,
        entityType=EntityType.workspace,
        role=MemberRole.owner,
        userId=auth.userId,
    )

    user = await clerk_client.users.get_async(user_id=auth.userId)
    metadata = user.public_metadata or {}
    metadata["isOnboardingComplete"] = True
    await clerk_client.users.update_metadata_async(
        user_id=auth.userId,
        public_metadata=metadata,
    )

    return {"status": "provisioned"}
