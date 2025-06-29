# backend/app/models/game_input_field.py - НОВАЯ МОДЕЛЬ ДЛЯ ПОЛЕЙ ВВОДА
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class GameInputField(Base):
    """Модель полей ввода для игр и подкатегорий"""
    __tablename__ = "game_input_fields"

    id = Column(Integer, primary_key=True, index=True)

    # Связь с игрой (обязательная)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)

    # Связь с подкатегорией (опциональная - если null, то поле для всей игры)
    subcategory_id = Column(Integer, ForeignKey("game_subcategories.id", ondelete="CASCADE"), nullable=True)

    # Данные поля
    name = Column(String(100), nullable=False)  # Имя поля (например, "player_id")
    label = Column(String(200), nullable=False)  # Отображаемое название (например, "ID игрока")

    # Тип поля
    field_type = Column(String(20), nullable=False, default="text")  # text, email, password, number, select, textarea

    # Настройки валидации
    required = Column(Boolean, default=True, nullable=False)
    placeholder = Column(String(255), nullable=True)
    help_text = Column(Text, nullable=True)

    # Для select - список опций в JSON формате
    options = Column(JSON, nullable=True)  # ["Россия", "Глобал", "Индонезия"]

    # Дополнительные настройки валидации
    min_length = Column(Integer, nullable=True)
    max_length = Column(Integer, nullable=True)
    validation_regex = Column(String(500), nullable=True)

    # Порядок отображения
    sort_order = Column(Integer, default=0, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)

    # Relationships
    game = relationship("Game", back_populates="input_fields")
    subcategory = relationship("GameSubcategory", back_populates="input_fields")

    def __str__(self):
        scope = f"[{self.subcategory.name}]" if self.subcategory else "[Общее]"
        return f"{self.game.name} {scope} - {self.label}"

    def to_dict(self):
        """Преобразует поле в словарь для фронтенда"""
        return {
            "name": self.name,
            "label": self.label,
            "type": self.field_type,
            "required": self.required,
            "placeholder": self.placeholder,
            "help_text": self.help_text,
            "options": self.options,
            "min_length": self.min_length,
            "max_length": self.max_length,
            "validation_regex": self.validation_regex,
            "subcategory_id": self.subcategory_id  # ⭐ ДОБАВЬТЕ ЭТУ СТРОКУ!
        }