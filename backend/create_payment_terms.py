# backend/create_payment_terms.py - НОВЫЙ ФАЙЛ
from app.core.database import SessionLocal
from app.models.payment_terms import PaymentTerm


def create_default_terms():
    """Создать стандартные пользовательские соглашения"""
    db = SessionLocal()

    default_terms = [
        {
            "title": "Вы подтверждаете, что ввели верные данные и выбрали верный регион",
            "description": "Проверьте правильность введенных данных перед оплатой",
            "is_required": True,
            "sort_order": 1
        },
        {
            "title": "Вы ознакомлены с Политикой обработки персональных данных",
            "description": "Согласие на обработку персональных данных согласно ФЗ-152",
            "is_required": True,
            "sort_order": 2
        },
        {
            "title": "Вы подтверждаете, что проверили данные заказа",
            "description": "Убедитесь, что выбранные товары и количество соответствуют вашим потребностям",
            "is_required": True,
            "sort_order": 3
        },
        {
            "title": "Я согласен с условиями предоставления услуг",
            "description": "Согласие с пользовательским соглашением и условиями сервиса",
            "is_required": True,
            "sort_order": 4
        },
        {
            "title": "Я понимаю, что возврат средств производится на баланс аккаунта",
            "description": "В случае возврата, средства будут зачислены на ваш баланс в личном кабинете",
            "is_required": True,
            "sort_order": 5
        }
    ]

    created_count = 0
    for term_data in default_terms:
        # Проверяем, не существует ли уже такое соглашение
        existing = db.query(PaymentTerm).filter_by(title=term_data["title"]).first()
        if not existing:
            term = PaymentTerm(**term_data)
            db.add(term)
            created_count += 1

    db.commit()
    db.close()

    print(f"✅ Создано {created_count} стандартных соглашений")
    return created_count


if __name__ == "__main__":
    create_default_terms()