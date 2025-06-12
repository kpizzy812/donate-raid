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
