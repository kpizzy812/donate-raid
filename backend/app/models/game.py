from sqlalchemy import Column, Integer, String, Boolean, Text
from app.core.database import Base
from sqlalchemy.orm import relationship
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    banner_url = Column(String(255), nullable=True)
    auto_support = Column(Boolean, default=True, nullable=False)
    instructions = Column(Text, nullable=True)
    products = relationship("Product", back_populates="game")
    sort_order = Column(Integer, default=0, nullable=False)
