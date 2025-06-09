from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.users import UserCreate


def get_or_create_user(db: Session, user_data: UserCreate) -> User:
    user = db.query(User).filter_by(telegram_id=user_data.telegram_id).first()
    if not user:
        user = User(telegram_id=user_data.telegram_id, username=user_data.username)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
