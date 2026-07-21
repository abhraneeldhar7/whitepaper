from fastapi import APIRouter

from app.api.private.users import router as users_router
from app.api.private.workspaces import router as workspaces_router

router = APIRouter(prefix="/private")
router.include_router(users_router)
router.include_router(workspaces_router)
