# backend/app/routers/__init__.py - ОБНОВЛЕННАЯ ВЕРСИЯ

from fastapi import APIRouter

# Public routes
from . import games, orders, users, products, auth, support, upload, payment_terms  # 🆕 Добавляем payment_terms
from .blog import article

# Admin routes
from .admin import (
    games as admin_games,
    products as admin_products,
    orders as admin_orders,
    articles as admin_articles,
    users as admin_users,
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
router.include_router(payment_terms.router, prefix="/api/payment-terms", tags=["Payment Terms"])  # 🆕

# Admin API
router.include_router(admin_games.router, prefix="/api/admin/games", tags=["Admin Games"])
router.include_router(admin_products.router, prefix="/api/admin/products", tags=["Admin Products"])
router.include_router(admin_orders.router, prefix="/api/admin/orders", tags=["Admin Orders"])
router.include_router(admin_articles.router, prefix="/api/admin/articles", tags=["Admin Articles"])
router.include_router(admin_users.router, prefix="/api/admin/users", tags=["Admin Users"])