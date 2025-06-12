# backend/app/routers/referrals.py - НОВЫЙ ФАЙЛ
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.referral import ReferralEarning
from app.services.referral import ReferralService
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

router = APIRouter()


class ReferralStatsResponse(BaseModel):
    referral_code: str
    referral_link: str
    total_referrals: int
    total_earned: float
    referral_percentage: float


class ReferralEarningResponse(BaseModel):
    id: int
    amount: float
    percentage: float
    order_id: int
    referred_username: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class ReferralRegisterRequest(BaseModel):
    referral_code: str


@router.get("/my-stats", response_model=ReferralStatsResponse)
def get_my_referral_stats(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Получить статистику по рефералам текущего пользователя"""

    # Генерируем реферальный код если его нет
    if not current_user.referral_code:
        current_user.generate_referral_code()
        db.commit()
        db.refresh(current_user)

    # Подсчитываем общую сумму заработка
    total_earned = db.query(ReferralEarning).filter_by(
        referrer_id=current_user.id
    ).with_entities(
        db.func.sum(ReferralEarning.amount)
    ).scalar() or Decimal("0")

    # Генерируем реферальную ссылку
    referral_link = ReferralService.generate_referral_link(current_user)

    return ReferralStatsResponse(
        referral_code=current_user.referral_code,
        referral_link=referral_link,
        total_referrals=current_user.total_referrals,
        total_earned=float(total_earned),
        referral_percentage=float(ReferralService.get_referral_percentage())
    )


@router.get("/my-earnings", response_model=List[ReferralEarningResponse])
def get_my_earnings(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Получить историю реферальных выплат"""

    earnings = db.query(ReferralEarning).filter_by(
        referrer_id=current_user.id
    ).order_by(ReferralEarning.created_at.desc()).limit(50).all()

    result = []
    for earning in earnings:
        referred_user = db.query(User).filter_by(id=earning.referred_user_id).first()
        result.append(ReferralEarningResponse(
            id=earning.id,
            amount=float(earning.amount),
            percentage=float(earning.percentage),
            order_id=earning.order_id,
            referred_username=referred_user.username if referred_user else None,
            created_at=earning.created_at.isoformat()
        ))

    return result


@router.post("/register-with-code")
def register_with_referral_code(
        data: ReferralRegisterRequest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Привязать реферальный код к уже существующему пользователю"""

    # Проверяем, что у пользователя еще нет реферера
    if current_user.referred_by_id:
        raise HTTPException(
            status_code=400,
            detail="Вы уже зарегистрированы по реферальной ссылке"
        )

    # Регистрируем реферала
    success = ReferralService.register_referral(db, current_user, data.referral_code)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Реферальный код не найден"
        )

    return {"message": "Реферальный код успешно применен"}


@router.get("/validate-code/{referral_code}")
def validate_referral_code(
        referral_code: str,
        db: Session = Depends(get_db)
):
    """Проверить существование реферального кода"""

    user = ReferralService.get_user_by_referral_code(db, referral_code)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Реферальный код не найден"
        )

    return {
        "valid": True,
        "referrer_username": user.username,
        "message": f"Реферальный код принадлежит пользователю {user.username or 'Неизвестно'}"
    }