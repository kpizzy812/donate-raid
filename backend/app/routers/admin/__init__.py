from .games import router as games_router
from .products import router as products_router
from .orders import router as orders_router
from .articles import router as articles_router
from .users import router as users_router

__all__ = [
    "games_router",
    "products_router",
    "orders_router",
    "articles_router",
    "users_router",
]
