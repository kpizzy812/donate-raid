# backend/app/routers/payment_terms.py - НОВЫЙ ФАЙЛ
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth import admin_required
from app.models.payment_terms import PaymentTerm
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class PaymentTermBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_required: bool = True
    is_active: bool = True
    sort_order: int = 0


class PaymentTermCreate(PaymentTermBase):
    pass


class PaymentTermUpdate(PaymentTermBase):
    pass


class PaymentTermRead(PaymentTermBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[PaymentTermRead])
def get_payment_terms(db: Session = Depends(get_db)):
    """Получить активные пользовательские соглашения для отображения при оплате"""
    terms = db.query(PaymentTerm).filter_by(is_active=True).order_by(PaymentTerm.sort_order.asc()).all()
    return terms


@router.get("/admin/all", response_model=List[PaymentTermRead])
def get_all_payment_terms(db: Session = Depends(get_db), admin=Depends(admin_required)):
    """Получить все пользовательские соглашения (для админки)"""
    terms = db.query(PaymentTerm).order_by(PaymentTerm.sort_order.asc()).all()
    return terms


@router.post("/admin/", response_model=PaymentTermRead)
def create_payment_term(
        term_data: PaymentTermCreate,
        db: Session = Depends(get_db),
        admin=Depends(admin_required)
):
    """Создать новое пользовательское соглашение"""
    new_term = PaymentTerm(**term_data.dict())
    db.add(new_term)
    db.commit()
    db.refresh(new_term)
    return new_term


@router.put("/admin/{term_id}", response_model=PaymentTermRead)
def update_payment_term(
        term_id: int,
        term_data: PaymentTermUpdate,
        db: Session = Depends(get_db),
        admin=Depends(admin_required)
):
    """Обновить пользовательское соглашение"""
    term = db.query(PaymentTerm).filter_by(id=term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Payment term not found")

    for field, value in term_data.dict(exclude_unset=True).items():
        setattr(term, field, value)

    db.commit()
    db.refresh(term)
    return term


@router.delete("/admin/{term_id}")
def delete_payment_term(
        term_id: int,
        db: Session = Depends(get_db),
        admin=Depends(admin_required)
):
    """Удалить пользовательское соглашение"""
    term = db.query(PaymentTerm).filter_by(id=term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Payment term not found")

    db.delete(term)
    db.commit()
    return {"detail": "Payment term deleted"}


# Предустановленные варианты соглашений
@router.post("/admin/create-defaults")
def create_default_payment_terms(db: Session = Depends(get_db), admin=Depends(admin_required)):
    """Создать стандартные пользовательские соглашения"""

    default_terms = [
        PaymentTerm(
            title="Вы подтверждаете, что ввели верные данные и выбрали верный регион",
            description="Проверьте правильность введенных данных перед оплатой",
            is_required=True,
            sort_order=1
        ),
        PaymentTerm(
            title="Вы ознакомлены с Политикой обработки персональных данных",
            description="Согласие на обработку персональных данных согласно ФЗ-152",
            is_required=True,
            sort_order=2
        ),
        PaymentTerm(
            title="Вы подтверждаете, что проверили данные заказа",
            description="Убедитесь, что выбранные товары и количество соответствуют вашим потребностям",
            is_required=True,
            sort_order=3
        ),
        PaymentTerm(
            title="Я согласен с условиями предоставления услуг",
            description="Согласие с пользовательским соглашением и условиями сервиса",
            is_required=True,
            sort_order=4
        )
    ]

    created_count = 0
    for term_data in default_terms:
        # Проверяем, не существует ли уже такое соглашение
        existing = db.query(PaymentTerm).filter_by(title=term_data.title).first()
        if not existing:
            db.add(term_data)
            created_count += 1

    db.commit()

    return {
        "message": f"Создано {created_count} стандартных соглашений",
        "created_count": created_count
    }