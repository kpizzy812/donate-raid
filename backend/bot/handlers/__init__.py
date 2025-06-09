from aiogram import Router
from .base import router as base_router
from .manual_orders import router as manual_orders_router
from .support import router as support_router

router = Router()

router.include_router(base_router)
router.include_router(manual_orders_router)
router.include_router(support_router)
