# backend/app/routers/auth.py - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ ВАШЕЙ СИСТЕМЫ
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from uuid import uuid4
from pydantic import BaseModel, EmailStr
from jose import jwt

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.auth_token import AuthToken
from app.services.mailer import send_email, render_template
from app.services.referral import ReferralService
from app.services.auth import get_current_user

router = APIRouter()


class EmailRequest(BaseModel):
    email: EmailStr
    referral_code: str = None  # Добавляем поддержку реферального кода


class TelegramAuthRequest(BaseModel):
    telegram_id: int
    username: str = None
    first_name: str = None
    last_name: str = None
    referral_code: str = None


@router.post("/request-link")
def request_login_link(data: EmailRequest, db: Session = Depends(get_db)):
    """Запрос ссылки для входа на email"""
    user = db.query(User).filter_by(email=data.email).first()

    if not user:
        # Создаем нового пользователя
        user = User(email=data.email)

        # Генерируем реферальный код сразу при создании
        user.generate_referral_code()

        db.add(user)
        db.flush()  # Получаем ID пользователя

        # Обрабатываем реферальный код если указан
        if data.referral_code:
            referral_success = ReferralService.register_referral(
                db, user, data.referral_code
            )
            if not referral_success:
                print(f"Предупреждение: Не удалось применить реферальный код {data.referral_code}")

        db.commit()
        db.refresh(user)
    else:
        # Генерируем реферальный код если его нет у существующего пользователя
        if not user.referral_code:
            user.generate_referral_code()
            db.commit()
            db.refresh(user)

    # Создаем токен для авторизации
    token = str(uuid4())
    expires = datetime.utcnow() + timedelta(minutes=30)

    db.add(AuthToken(user_id=user.id, token=token, expires_at=expires))
    db.commit()

    # Ссылка для входа
    link = f"{settings.FRONTEND_URL}/auth/verify?token={token}"

    # Рендер письма и отправка
    html = render_template("login_link.html", {"link": link})
    send_email(
        to=user.email,
        subject="🔐 Ваш вход в Donate Raid",
        body=html
    )

    return {"message": "Login link sent to your email"}


@router.get("/verify")
def verify_token(token: str = Query(...), db: Session = Depends(get_db)):
    """Верификация токена из email"""
    auth_token = db.query(AuthToken).filter_by(token=token).first()

    if not auth_token:
        raise HTTPException(status_code=400, detail="Invalid token")
    if auth_token.expires_at < datetime.utcnow():
        # Удаляем истекший токен
        db.delete(auth_token)
        db.commit()
        raise HTTPException(status_code=400, detail="Token expired")

    user = auth_token.user

    # Убеждаемся что у пользователя есть реферальный код
    if not user.referral_code:
        user.generate_referral_code()
        db.commit()
        db.refresh(user)

    # Создаем JWT токен
    jwt_payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }

    jwt_token = jwt.encode(jwt_payload, settings.JWT_SECRET, algorithm="HS256")

    # Удаляем использованый токен авторизации
    db.delete(auth_token)
    db.commit()

    return {"token": jwt_token}


@router.post("/telegram-auth")
def telegram_auth(request: TelegramAuthRequest, db: Session = Depends(get_db)):
    """Авторизация через Telegram"""

    # Ищем существующего пользователя
    user = db.query(User).filter(User.telegram_id == request.telegram_id).first()

    if not user:
        # Создаем нового пользователя
        display_name = request.first_name or "Telegram User"
        if request.last_name:
            display_name += f" {request.last_name}"

        user = User(
            telegram_id=request.telegram_id,
            username=request.username or display_name,
            balance=0
        )

        # Генерируем реферальный код
        user.generate_referral_code()

        db.add(user)
        db.flush()  # Получаем ID пользователя

        # Обрабатываем реферальный код
        if request.referral_code:
            referral_success = ReferralService.register_referral(
                db, user, request.referral_code
            )
            if not referral_success:
                print(f"Предупреждение: Не удалось применить реферальный код {request.referral_code}")

        db.commit()
        db.refresh(user)
    else:
        # Обновляем информацию существующего пользователя
        if request.username and not user.username:
            user.username = request.username

        # Генерируем реферальный код если его нет
        if not user.referral_code:
            user.generate_referral_code()

        db.commit()
        db.refresh(user)

    # Создаем JWT токен
    jwt_payload = {
        "sub": str(user.id),
        "email": user.email,
        "telegram_id": user.telegram_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }

    jwt_token = jwt.encode(jwt_payload, settings.JWT_SECRET, algorithm="HS256")

    return {
        "token": jwt_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "telegram_id": user.telegram_id,
            "balance": float(user.balance),
            "referral_code": user.referral_code,
            "role": user.role.value
        }
    }


@router.get("/me")
def get_current_user_info(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Получить информацию о текущем пользователе"""

    # Генерируем реферальный код если его нет
    if not current_user.referral_code:
        current_user.generate_referral_code()
        db.commit()
        db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "telegram_id": current_user.telegram_id,
        "balance": float(current_user.balance),
        "referral_code": current_user.referral_code,
        "role": current_user.role.value,
        "total_referrals": current_user.total_referrals,
        "referral_earnings": float(current_user.referral_earnings)
    }


@router.put("/me")
def update_current_user(
        update_data: dict,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Обновить информацию о текущем пользователе"""

    # Обновляем разрешенные поля
    if "username" in update_data:
        current_user.username = update_data["username"]
    if "email" in update_data:
        # Проверяем, что email не занят
        existing = db.query(User).filter(
            User.email == update_data["email"],
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(400, "Email уже используется")
        current_user.email = update_data["email"]

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "telegram_id": current_user.telegram_id,
        "balance": float(current_user.balance),
        "referral_code": current_user.referral_code,
        "role": current_user.role.value
    }