# backend/app/models/__init__.py
from app.models.game import Game
from app.models.product import Product
from app.models.user import User
from app.models.order import Order
from app.models.auth_token import AuthToken
from app.models.blog.article import Article, ArticleTag
from app.models.support import SupportMessage
from app.models.referral import ReferralEarning
from app.models.payment_terms import PaymentTerm

__all__ = [
    "Game",
    "Product",
    "User",
    "Order",
    "AuthToken",
    "Article",
    "ArticleTag",
    "SupportMessage",
    "ReferralEarning",
    "PaymentTerm",
    # "GameFAQ",
    # "GameInstruction",
]