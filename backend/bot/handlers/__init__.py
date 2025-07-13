# backend/bot/handlers/__init__.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ОТЗЫВАМИ
from aiogram import Router
from .base import router as base_router
from .manual_orders import router as manual_orders_router
from .paid_orders import router as paid_orders_router
from .support import router as support_router
from .admin import router as admin_router
from .reviews import router as reviews_router  # ДОБАВЛЕНО

router = Router()

router.include_router(base_router)
router.include_router(manual_orders_router)
router.include_router(paid_orders_router)
router.include_router(support_router)
router.include_router(admin_router)
router.include_router(reviews_router)  # ДОБАВЛЕНО