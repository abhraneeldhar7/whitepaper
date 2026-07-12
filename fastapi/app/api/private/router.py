from fastapi import APIRouter

from app.api.private.users import router as users_router

router = APIRouter(prefix="/private")
router.include_router(users_router)
