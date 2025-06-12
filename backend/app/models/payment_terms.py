# backend/app/models/payment_terms.py - НОВЫЙ ФАЙЛ
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class PaymentTerm(Base):
    """Модель для настраиваемых галок при оплате"""
    __tablename__ = "payment_terms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)  # "Вы подтверждаете, что ввели верные данные"
    description = Column(Text, nullable=True)  # Дополнительное описание
    is_required = Column(Boolean, default=True)  # Обязательная ли галка
    is_active = Column(Boolean, default=True)  # Активна ли (отображается)
    sort_order = Column(Integer, default=0)  # Порядок отображения

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Также создадим модель для FAQ игр
class GameFAQ(Base):
    """Модель для часто задаваемых вопросов по играм"""
    __tablename__ = "game_faqs"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    question = Column(String(500), nullable=False)
    answer = Column(Text, nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    game = relationship("Game", back_populates="faqs")


# Модель для инструкций к играм
class GameInstruction(Base):
    """Модель для инструкций к играм"""
    __tablename__ = "game_instructions"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    title = Column(String(255), nullable=False)  # "Как пополнить аккаунт"
    content = Column(Text, nullable=False)  # HTML контент инструкции
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    game = relationship("Game", back_populates="instructions")