# backend/app/routers/__init__.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ОТЗЫВАМИ
from fastapi import APIRouter
from loguru import logger

# Public routes
from . import games, orders, users, products, auth, support, upload, payment_terms, notifications, robokassa, reviews
from .blog import article

# Admin routes
from .admin import (
    games as admin_games,
    products as admin_products,
    orders as admin_orders,
    articles as admin_articles,
    users as admin_users,
    subcategories as admin_subcategories,
    reviews as admin_reviews,  # ДОБАВЛЕНО
)

router = APIRouter()

# Public API
router.include_router(games.router, prefix="/api/games", tags=["Games"])
router.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
router.include_router(users.router, prefix="/api/users", tags=["Users"])
router.include_router(products.router, prefix="/api/products", tags=["Products"])
router.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
router.include_router(article.router, prefix="/api/articles", tags=["Articles"])
router.include_router(support.router, prefix="/api/support", tags=["Support"])
router.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
router.include_router(payment_terms.router, prefix="/api/payment-terms", tags=["Payment Terms"])
router.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

# 🆕 REVIEWS API
router.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
logger.info("✅ Reviews роутер зарегистрирован: /api/reviews")

# 🆕 ROBOKASSA API
router.include_router(robokassa.router, prefix="/api/robokassa", tags=["RoboKassa"])
logger.info("✅ RoboKassa роутер зарегистрирован: /api/robokassa")

# Admin API
logger.info("🔧 Регистрируем admin роутеры...")
router.include_router(admin_games.router, prefix="/api/admin/games", tags=["Admin Games"])
logger.info("✅ Admin games роутер зарегистрирован: /api/admin/games")

router.include_router(admin_products.router, prefix="/api/admin/products", tags=["Admin Products"])
router.include_router(admin_orders.router, prefix="/api/admin/orders", tags=["Admin Orders"])
router.include_router(admin_articles.router, prefix="/api/admin/articles", tags=["Admin Articles"])
router.include_router(admin_users.router, prefix="/api/admin/users", tags=["Admin Users"])
router.include_router(admin_subcategories.router, prefix="/api/admin/subcategories", tags=["Admin Subcategories"])

# 🆕 ADMIN REVIEWS API
router.include_router(admin_reviews.router, prefix="/api/admin/reviews", tags=["Admin Reviews"])
logger.info("✅ Admin reviews роутер зарегистрирован: /api/admin/reviews")

logger.info("✅ Все роутеры зарегистрированы")