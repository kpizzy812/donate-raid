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

router = APIRouter()


class EmailRequest(BaseModel):
    email: EmailStr


@router.post("/request-link")
def request_login_link(data: EmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=data.email).first()

    if not user:
        user = User(email=data.email)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = str(uuid4())
    expires = datetime.utcnow() + timedelta(minutes=30)

    db.add(AuthToken(user_id=user.id, token=token, expires_at=expires))
    db.commit()

    # 🔗 Ссылка для входа
    link = f"{settings.FRONTEND_URL}/auth/verify?token={token}"

    # 📩 Рендер письма и отправка
    html = render_template("login_link.html", {"link": link})
    send_email(
        to=user.email,
        subject="Ваш вход в Donate Raid",
        body=html
    )

    return {"message": "Login link sent to your email"}


@router.get("/verify")
def verify_token(token: str = Query(...), db: Session = Depends(get_db)):
    auth_token = db.query(AuthToken).filter_by(token=token).first()

    if not auth_token:
        raise HTTPException(status_code=400, detail="Invalid token")
    if auth_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")

    user = auth_token.user

    jwt_payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }

    jwt_token = jwt.encode(jwt_payload, settings.JWT_SECRET, algorithm="HS256")

    return {"token": jwt_token}
