# backend/app/routers/auth.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.auth_token import AuthToken
from app.services.auth import get_current_user, create_access_token
from app.services.referral import ReferralService
from pydantic import BaseModel, EmailStr

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str
    telegram_id: Optional[int] = None
    referral_code: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class TelegramAuthRequest(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    referral_code: Optional[str] = None


@router.post("/register", response_model=LoginResponse)
def register(
        request: RegisterRequest,
        db: Session = Depends(get_db)
):
    """Регистрация нового пользователя"""

    # Проверяем, что указан хотя бы email или telegram_id
    if not request.email and not request.telegram_id:
        raise HTTPException(
            status_code=400,
            detail="Необходимо указать email или telegram_id"
        )

    # Проверяем существование пользователя
    existing_user = None
    if request.email:
        existing_user = db.query(User).filter(User.email == request.email).first()
    if not existing_user and request.telegram_id:
        existing_user = db.query(User).filter(User.telegram_id == request.telegram_id).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с такими данными уже существует"
        )

    # Создаем нового пользователя
    user = User(
        email=request.email,
        username=request.username,
        telegram_id=request.telegram_id,
        balance=0
    )

    # Генерируем реферальный код
    user.generate_referral_code()

    # Хешируем пароль (если указан)
    if request.password:
        user.password_hash = pwd_context.hash(request.password)

    # Сохраняем пользователя
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

    # Создаем токен доступа
    access_token = create_access_token(data={"sub": str(user.id)})

    # Сохраняем токен в базе
    auth_token = AuthToken(
        user_id=user.id,
        token=access_token,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.add(auth_token)
    db.commit()

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "telegram_id": user.telegram_id,
            "balance": float(user.balance),
            "referral_code": user.referral_code,
            "role": user.role.value
        }
    )


@router.post("/login", response_model=LoginResponse)
def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    """Авторизация пользователя"""

    # Ищем пользователя по email или username
    user = db.query(User).filter(
        (User.email == form_data.username) |
        (User.username == form_data.username)
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Неверные учетные данные"
        )

    # Проверяем пароль
    if not user.password_hash or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Неверные учетные данные"
        )

    # Генерируем реферальный код если его нет
    if not user.referral_code:
        user.generate_referral_code()
        db.commit()
        db.refresh(user)

    # Создаем токен доступа
    access_token = create_access_token(data={"sub": str(user.id)})

    # Сохраняем токен в базе
    auth_token = AuthToken(
        user_id=user.id,
        token=access_token,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.add(auth_token)
    db.commit()

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "telegram_id": user.telegram_id,
            "balance": float(user.balance),
            "referral_code": user.referral_code,
            "role": user.role.value
        }
    )


@router.post("/telegram-auth", response_model=LoginResponse)
def telegram_auth(
        request: TelegramAuthRequest,
        db: Session = Depends(get_db)
):
    """Авторизация через Telegram"""

    # Ищем существующего пользователя
    user = db.query(User).filter(User.telegram_id == request.telegram_id).first()

    if not user:
        # Создаем нового пользователя
        display_name = request.first_name
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

    # Создаем токен доступа
    access_token = create_access_token(data={"sub": str(user.id)})

    # Сохраняем токен в базе
    auth_token = AuthToken(
        user_id=user.id,
        token=access_token,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.add(auth_token)
    db.commit()

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "telegram_id": user.telegram_id,
            "balance": float(user.balance),
            "referral_code": user.referral_code,
            "role": user.role.value
        }
    )


@router.post("/logout")
def logout(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Выход из системы"""

    # Удаляем все токены пользователя
    db.query(AuthToken).filter(AuthToken.user_id == current_user.id).delete()
    db.commit()

    return {"message": "Успешный выход из системы"}


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