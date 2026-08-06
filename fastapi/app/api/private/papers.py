import time
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import update

from app.core.config import settings
from app.core.database import db
from app.core.r2storage import r2_client
from app.core.security import get_verified_request, VerifiedRequest
from app.services.paper import (
    create_paper,
    generate_unique_slug,
    get_paper_by_id,
    get_paper_by_slug,
    get_paper_content,
    get_paper_count_in_workspace,
)
from app.services.access_control import check_access
from app.services.workspace import get_workspace_by_id
from app.services.project import get_project_by_id
from app.services.collection import get_collection_by_id
from app.shared.constants import (
    BANNER_MAX_HEIGHT_PIXELS,
    BANNER_MAX_WIDTH_PIXELS,
    RESERVED_SLUGS,
)
from app.shared.plan_limits import PLAN_LIMITS
from app.shared.schema import Paper, PaperContent, Visibility
from app.utils.helpers import now
from app.utils.images import compress_image

router = APIRouter(prefix="/papers", tags=["papers"])


@router.get("/id/{paperId}")
async def get_paper_by_id_endpoint(
    paperId: str,
    withContent: bool = Query(False),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    paper = await get_paper_by_id(session, paperId)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    roles = auth.roles if auth else []
    has_access, role = check_access(roles, paper, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    if withContent:
        content_row = (await session.execute(
            select(PaperContent).where(PaperContent.paperId == paperId)
        )).scalar_one_or_none()
        paper_data = paper.model_dump()
        paper_data["content"] = content_row.content if content_row else None
        return {"role": role, "data": paper_data}

    return {"role": role, "data": paper}


@router.get("/slug/{slug}")
async def get_paper_by_slug_endpoint(
    slug: str,
    withContent: bool = Query(False),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    paper = await get_paper_by_slug(session, slug)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    roles = auth.roles if auth else []
    has_access, role = check_access(roles, paper, "view")
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    if withContent:
        content_row = (await session.execute(
            select(PaperContent).where(PaperContent.paperId == paper.paperId)
        )).scalar_one_or_none()
        paper_data = paper.model_dump()
        paper_data["content"] = content_row.content if content_row else None
        return {"role": role, "data": paper_data}

    return {"role": role, "data": paper}


@router.post("/create")
async def create_paper_endpoint(
    workspaceId: str = Query(...),
    projectId: str | None = Query(None),
    collectionId: str | None = Query(None),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    workspace = await get_workspace_by_id(session, workspaceId)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if collectionId:
        collection = await get_collection_by_id(session, collectionId)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        has_access, role = check_access(auth.roles, collection, "create")
        if not has_access:
            raise HTTPException(status_code=403, detail="You don't have permission to create papers in this collection")
    elif projectId:
        project = await get_project_by_id(session, projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        has_access, role = check_access(auth.roles, project, "create")
        if not has_access:
            raise HTTPException(status_code=403, detail="You don't have permission to create papers in this project")
    else:
        has_access, role = check_access(auth.roles, workspace, "create")
        if not has_access:
            raise HTTPException(status_code=403, detail="You don't have permission to create papers in this workspace")

    limits = PLAN_LIMITS.get(workspace.plan)
    if not limits:
        raise HTTPException(status_code=400, detail="Unknown workspace plan")

    max_papers = limits.get("max_papers")
    if max_papers is not None:
        current_count = await get_paper_count_in_workspace(session, workspaceId)
        if current_count >= max_papers:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {max_papers} papers allowed on the {workspace.plan} plan",
            )

    paper_id = uuid.uuid4().hex
    if paper_id in RESERVED_SLUGS["paper"]:
        raise HTTPException(status_code=400, detail="This slug is reserved")

    paper = await create_paper(
        db=session,
        workspaceId=workspaceId,
        title="New Paper",
        publicSlug=paper_id,
        visibility=Visibility.private,
        isNew=True,
        projectId=projectId,
        collectionId=collectionId,
        paperId=paper_id,
    )

    return {"role": role, "data": paper}


@router.post("/save")
async def save_paper_endpoint(
    paperId: str = Query(...),
    title: str | None = Form(None),
    content: str | None = Form(None),
    isNew: bool | None = Form(None),
    thumbnail: UploadFile | None = File(None),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    paper = await get_paper_by_id(session, paperId)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    has_access, _ = check_access(auth.roles, paper, "edit")
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have permission to edit this paper")

    response: dict = {"success": True}
    did_update = False

    if thumbnail and thumbnail.filename:
        key = f"papers/{paperId}/thumbnail"
        contents = await thumbnail.read()
        fmt = (thumbnail.content_type or "").split("/")[-1].upper() or "PNG"
        cache_buster = str(int(time.time()))[-4:]
        compressed = compress_image(
            contents,
            max_width=BANNER_MAX_WIDTH_PIXELS,
            max_height=BANNER_MAX_HEIGHT_PIXELS,
            crop=False,
            output_format=fmt,
        )
        r2_client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=key,
            Body=compressed,
            ContentType=thumbnail.content_type,
        )
        thumbnail_url = f"{settings.R2_PUBLIC_URL}/{key}?t={cache_buster}"
        await session.execute(
            update(Paper).where(Paper.paperId == paperId).values(thumbnailUrl=thumbnail_url)
        )
        response["thumbnailUrl"] = thumbnail_url
        did_update = True

    if title is not None or content is not None:
        update_values: dict = {"updatedAt": now()}

        if title is not None:
            update_values["title"] = title

            if isNew and len(title) > 4:
                new_slug = await generate_unique_slug(session, paper.workspaceId, title, paperId)
                if new_slug in RESERVED_SLUGS["paper"]:
                    raise HTTPException(status_code=400, detail="This slug is reserved")
                update_values["publicSlug"] = new_slug
                update_values["isNew"] = False
                response["publicSlug"] = new_slug

        if update_values:
            await session.execute(
                update(Paper).where(Paper.paperId == paperId).values(**update_values)
            )

        if content is not None:
            existing = await get_paper_content(session, paperId)
            if existing:
                existing.content = content
            else:
                session.add(PaperContent(paperId=paperId, content=content))

        did_update = True

    if not did_update:
        raise HTTPException(status_code=400, detail="Nothing to save")

    return response


@router.post("/remove-thumbnail")
async def remove_thumbnail_endpoint(
    paperId: str = Query(...),
    session: AsyncSession = Depends(db.get_db),
    auth: VerifiedRequest | None = Depends(get_verified_request),
) -> dict:
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    paper = await get_paper_by_id(session, paperId)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    has_access, _ = check_access(auth.roles, paper, "edit")
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have permission to edit this paper")

    key = f"papers/{paperId}/thumbnail"
    r2_client.delete_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
    )

    await session.execute(
        update(Paper).where(Paper.paperId == paperId).values(thumbnailUrl=None)
    )

    return {"success": True}
