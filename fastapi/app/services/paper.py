import re
import uuid
import random
import string

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schema import Paper, PaperContent, Visibility
from app.utils.helpers import now




def _random_suffix(length: int = 4) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


def normalize_slug(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)  # Strip invalid characters
    slug = re.sub(r"[\s]+", "-", slug)  # Replace whitespace with hyphens
    slug = re.sub(r"-+", "-", slug)  # delete repeated hyphens
    return slug.strip("-") or "untitled"


async def paper_slug_exists_in_workspace(
    db: AsyncSession,
    workspaceId: str,
    slug: str,
    exclude_paper_id: str | None = None,
) -> bool:
    stmt = select(Paper).where(
        Paper.workspaceId == workspaceId,
        Paper.publicSlug == slug,
    )
    if exclude_paper_id:
        stmt = stmt.where(Paper.paperId != exclude_paper_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def generate_unique_slug(
    db: AsyncSession,
    workspaceId: str,
    title: str,
    exclude_paper_id: str | None = None,
) -> str:
    base = normalize_slug(title)
    if not await paper_slug_exists_in_workspace(db, workspaceId, base, exclude_paper_id):
        return base
    for _ in range(5):
        slug = f"{base}-{_random_suffix()}"
        if not await paper_slug_exists_in_workspace(db, workspaceId, slug, exclude_paper_id):
            return slug
    return f"{base}-{_random_suffix(8)}"


async def get_paper_by_id(
    db: AsyncSession,
    paperId: str,
) -> Paper | None:
    result = await db.execute(
        select(Paper).where(Paper.paperId == paperId)
    )
    return result.scalar_one_or_none()


async def get_paper_by_slug(
    db: AsyncSession,
    slug: str,
) -> Paper | None:
    result = await db.execute(
        select(Paper).where(Paper.publicSlug == slug)
    )
    return result.scalar_one_or_none()

async def get_paper_content(
    db: AsyncSession,
    paperId: str,
) -> PaperContent | None:
    result = await db.execute(
        select(PaperContent).where(PaperContent.paperId == paperId)
    )
    return result.scalar_one_or_none()


async def get_paper_count_in_workspace(
    db: AsyncSession,
    workspaceId: str,
) -> int:
    result = await db.execute(
        select(func.count()).select_from(
            select(Paper).where(Paper.workspaceId == workspaceId).subquery()
        )
    )
    return result.scalar_one()


async def create_paper(
    db: AsyncSession,
    workspaceId: str,
    title: str,
    publicSlug: str,
    visibility: Visibility,
    projectId: str | None = None,
    collectionId: str | None = None,
    paperId: str | None = None,
    isNew: bool = True,
) -> Paper:
    paper = Paper(
        workspaceId=workspaceId,
        projectId=projectId,
        collectionId=collectionId,
        paperId=paperId or uuid.uuid4().hex,
        title=title,
        publicSlug=publicSlug,
        thumbnailUrl=None,
        visibility=visibility,
        isNew=isNew,
        createdAt=now(),
        updatedAt=now(),
    )
    db.add(paper)
    return paper
