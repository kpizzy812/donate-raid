from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, Boolean, Enum, BigInteger, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum

class SupportStatus(str, enum.Enum):
    new = "new"
    in_progress = "in_progress"
    resolved = "resolved"

class SupportMessage(Base):
    __tablename__ = "support_messages"

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    message = Column(Text, nullable=False)
    is_from_user = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # мета-инфо для админов
    status = Column(Enum(SupportStatus), default=SupportStatus.new, nullable=False)
    admin_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    thread_id = Column(Integer, nullable=True)
    guest_id = Column(String, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[admin_id])
