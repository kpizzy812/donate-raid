# backend/app/models/user.py - ОБНОВЛЕННАЯ ВЕРСИЯ
from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum
import secrets
import string


class UserRole(enum.Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, nullable=True)
    username = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, nullable=True)

    balance = Column(Numeric(12, 2), default=0, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)

    # Реферальная система
    referral_code = Column(String(20), unique=True, nullable=True, index=True)
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    referral_earnings = Column(Numeric(12, 2), default=0, nullable=False)
    total_referrals = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    orders = relationship("Order", back_populates="user")
    auth_tokens = relationship("AuthToken", back_populates="user", cascade="all, delete")

    # Реферальные связи
    referrer = relationship("User", remote_side=[id], backref="referrals")
    referral_earnings_history = relationship("ReferralEarning", foreign_keys="ReferralEarning.referrer_id")

    def generate_referral_code(self):
        """Генерирует уникальный реферальный код"""
        if not self.referral_code:
            # Генерируем код из букв и цифр, длиной 8 символов
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            self.referral_code = f"REF{code}"
        return self.referral_code

    def get_referral_stats(self, db):
        """Получает статистику по рефералам"""
        from app.models.referral import ReferralEarning

        total_earned = db.query(ReferralEarning).filter_by(referrer_id=self.id).count()
        total_amount = db.query(ReferralEarning).filter_by(referrer_id=self.id).with_entities(
            db.func.sum(ReferralEarning.amount)
        ).scalar() or 0

        return {
            "total_referrals": self.total_referrals,
            "total_earned": float(total_amount),
            "referral_code": self.referral_code
        }