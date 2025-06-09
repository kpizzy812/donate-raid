from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

import enum


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

    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")
    auth_tokens = relationship("AuthToken", back_populates="user", cascade="all, delete")
