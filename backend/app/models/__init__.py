# backend/app/models/__init__.py - ОБНОВЛЕННАЯ ВЕРСИЯ С REVIEW
from app.models.game import Game
from app.models.game_subcategory import GameSubcategory
from app.models.product import Product
from app.models.user import User
from app.models.order import Order
from app.models.auth_token import AuthToken
from app.models.blog.article import Article, ArticleTag
from app.models.support import SupportMessage
from app.models.referral import ReferralEarning
from app.models.payment_terms import PaymentTerm
from app.models.game_faq import GameFAQ
from app.models.game_instruction import GameInstruction
from app.models.game_input_field import GameInputField
from app.models.review import Review  # ДОБАВЛЕНО

__all__ = [
    "Game",
    "GameSubcategory",
    "GameInputField",
    "Product",
    "User",
    "Order",
    "AuthToken",
    "Article",
    "ArticleTag",
    "SupportMessage",
    "ReferralEarning",
    "PaymentTerm",
    "GameFAQ",
    "GameInstruction",
    "Review",  # ДОБАВЛЕНО
]