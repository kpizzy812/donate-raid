# backend/app/models/game.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОДКАТЕГОРИЯМИ
from sqlalchemy import Column, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    banner_url = Column(String(255), nullable=True)
    auto_support = Column(Boolean, default=True, nullable=False)
    instructions = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    # Поля для расширенного отображения
    description = Column(Text, nullable=True)
    subcategory_description = Column(Text, nullable=True)  # Описание системы подкатегорий
    logo_url = Column(String(255), nullable=True)
    faq_content = Column(Text, nullable=True)
    enabled = Column(Boolean, default=True)

    # Relationships
    products = relationship("Product", back_populates="game", cascade="all, delete-orphan")
    subcategories = relationship("GameSubcategory", back_populates="game", cascade="all, delete-orphan", order_by="GameSubcategory.sort_order")
    faqs = relationship("GameFAQ", back_populates="game", cascade="all, delete-orphan")
    instructions_list = relationship("GameInstruction", back_populates="game", cascade="all, delete-orphan")
    articles = relationship("Article", back_populates="game")

    def get_faq_list(self):
        """Парсит FAQ контент в список вопросов-ответов"""
        if not self.faq_content:
            return []

        try:
            import json
            return json.loads(self.faq_content)
        except:
            return [{"question": "FAQ", "answer": self.faq_content}]

    def set_faq_list(self, faq_list):
        """Сохраняет список FAQ в формате JSON"""
        import json
        self.faq_content = json.dumps(faq_list, ensure_ascii=False)

    def get_enabled_subcategories(self):
        """Возвращает только активные подкатегории"""
        return [sub for sub in self.subcategories if sub.enabled]