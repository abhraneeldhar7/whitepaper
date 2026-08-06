import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import db
from app.core.r2storage import r2_client
from app.core.security import get_verified_request, VerifiedRequest
from app.services.access_control import check_access
from app.services.project import (
    create_project,
    get_project_by_id,
    get_project_by_slug,
    get_project_count_in_workspace,
    project_slug_exists_in_workspace,
)
from app.services.workspace import get_workspace_by_id
from app.shared.plan_limits import PLAN_LIMITS
from app.shared.constants import (
    BANNER_MAX_HEIGHT_PIXELS,
    BANNER_MAX_WIDTH_PIXELS,
    LOGO_MAX_HEIGHT_PIXELS,
    LOGO_MAX_WIDTH_PIXELS,
)
from app.shared.schema import Project, Visibility
from app.utils.images import compress_image

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/id/{projectId}")
async def get_project_by_id(
    projectId: str,
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    project = await get_project_by_id(session, projectId)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    roles = auth.roles if auth else []
    has_access, role = check_access(roles, project, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"role": role, "data": project}


@router.get("/slug/{slug}")
async def get_project_by_slug(
    slug: str,
    workspaceId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    project = await get_project_by_slug(session, workspaceId, slug)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    roles = auth.roles if auth else []
    has_access, role = check_access(roles, project, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"role": role, "data": project}


@router.get("/check-slug")
async def check_slug(
    workspaceId: str = Query(...),
    slug: str = Query(...),
    projectId: Optional[str] = Query(None),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await session.execute(
        select(Project).where(
            Project.workspaceId == workspaceId,
            Project.publicSlug == slug,
        )
    )
    existing = result.scalar_one_or_none()
    if existing and existing.projectId != projectId:
        return {"available": False}
    return {"available": True}


@router.post("/create")
async def create_project_endpoint(
    workspaceId: str = Form(...),
    name: str = Form(...),
    publicSlug: str = Form(...),
    description: str = Form(""),
    visibility: str = Form(...),
    logo: UploadFile = File(None),
    banner: UploadFile = File(None),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")
    workspace = await get_workspace_by_id(session, workspaceId)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    has_access, role = check_access(auth.roles, workspace, "create")
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have permission to create projects in this workspace")

    limits = PLAN_LIMITS.get(workspace.plan)
    if not limits:
        raise HTTPException(status_code=400, detail="Unknown workspace plan")

    current_count = await get_project_count_in_workspace(session, workspaceId)
    if current_count >= limits["max_projects"]:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {limits['max_projects']} projects allowed on the {workspace.plan} plan",
        )

    if len(name) < 1 or len(name) > 20:
        raise HTTPException(status_code=400, detail="Project name must be between 1 and 20 characters")

    if len(description) > 200:
        raise HTTPException(status_code=400, detail="Description must be 200 characters or less")

    slug_exists = await project_slug_exists_in_workspace(session, workspaceId, publicSlug)
    if slug_exists:
        raise HTTPException(status_code=400, detail="A project with this slug already exists in the workspace")

    if visibility not in {v.value for v in Visibility}:
        raise HTTPException(status_code=400, detail="Invalid visibility value")

    project_id = uuid.uuid4().hex
    cache_buster = str(int(time.time()))[-4:]

    logo_url = None
    if logo and logo.filename:
        key = f"projects/{project_id}/logo"
        contents = await logo.read()
        fmt = (logo.content_type or "").split("/")[-1].upper() or "PNG"
        compressed = compress_image(
            contents,
            max_width=LOGO_MAX_WIDTH_PIXELS,
            max_height=LOGO_MAX_HEIGHT_PIXELS,
            crop=True,
            output_format=fmt,
        )
        r2_client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=key,
            Body=compressed,
            ContentType=logo.content_type,
        )
        logo_url = f"{settings.R2_PUBLIC_URL}/{key}?t={cache_buster}"

    banner_url = None
    if banner and banner.filename:
        key = f"projects/{project_id}/banner"
        contents = await banner.read()
        fmt = (banner.content_type or "").split("/")[-1].upper() or "PNG"
        compressed = compress_image(
            contents,
            max_width=BANNER_MAX_WIDTH_PIXELS,
            max_height=BANNER_MAX_HEIGHT_PIXELS,
            output_format=fmt,
        )
        r2_client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=key,
            Body=compressed,
            ContentType=banner.content_type,
        )
        banner_url = f"{settings.R2_PUBLIC_URL}/{key}?t={cache_buster}"

    project = await create_project(
        db=session,
        workspaceId=workspaceId,
        name=name,
        publicSlug=publicSlug,
        description=description,
        visibility=Visibility(visibility),
        projectId=project_id,
        logoUrl=logo_url,
        bannerUrl=banner_url,
    )

    return {"role": role, "data": project}
