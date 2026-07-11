from fastapi import APIRouter

from app.api.webhooks.clerk import router as clerk_router

router = APIRouter(prefix="/webhooks")
router.include_router(clerk_router)
