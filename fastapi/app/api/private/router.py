from fastapi import APIRouter

from app.api.private.users import router as users_router
from app.api.private.workspaces import router as workspaces_router
from app.api.private.dashboard import router as dashboard_router
from app.api.private.screen import router as screen_router
from app.api.private.projects import router as projects_router
from app.api.private.collections import router as collections_router
from app.api.private.papers import router as papers_router

router = APIRouter(prefix="/private")
router.include_router(users_router)
router.include_router(workspaces_router)
router.include_router(dashboard_router)
router.include_router(screen_router)
router.include_router(projects_router)
router.include_router(collections_router)
router.include_router(papers_router)
