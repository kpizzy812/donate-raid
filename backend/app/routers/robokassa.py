# backend/app/routers/robokassa.py
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.services.robokassa import robokassa_service
from app.services.telegram import notify_payment_sync
from app.services.mailer import send_email, render_template
from loguru import logger
from typing import Dict

router = APIRouter()


@router.post("/result")
async def robokassa_result(request: Request, db: Session = Depends(get_db)):
    """
    Webhook для уведомлений от RoboKassa о статусе платежа (Result URL)
    Этот endpoint вызывается RoboKassa для уведомления о результате оплаты
    """
    logger.info("🔔 Получен Result webhook от RoboKassa")

    # Получаем данные из POST запроса
    if request.headers.get("content-type") == "application/x-www-form-urlencoded":
        form_data = await request.form()
        data = dict(form_data)
    else:
        data = await request.json()

    logger.info(f"📦 Данные от RoboKassa: {data}")

    # Извлекаем необходимые параметры
    try:
        out_sum = data.get("OutSum")  # Сумма
        inv_id = data.get("InvId")  # ID заказа
        signature_value = data.get("SignatureValue")  # Подпись
        fee = data.get("Fee", "0")  # Комиссия (опционально)
        email = data.get("EMail")  # Email плательщика (опционально)

        if not all([out_sum, inv_id, signature_value]):
            raise ValueError("Отсутствуют обязательные параметры")

    except Exception as e:
        logger.error(f"❌ Ошибка парсинга данных от RoboKassa: {e}")
        raise HTTPException(status_code=400, detail="Invalid parameters")

    # Проверяем подпись
    if not robokassa_service.verify_signature_result(out_sum, inv_id, signature_value):
        logger.error("❌ Неверная подпись от RoboKassa")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Находим заказ
    order = db.query(Order).filter(Order.id == int(inv_id)).first()
    if not order:
        logger.error(f"❌ Заказ #{inv_id} не найден")
        raise HTTPException(status_code=404, detail="Order not found")

    logger.info(f"📋 Найден заказ #{order.id}, текущий статус: {order.status}")

    # Проверяем, что заказ еще не оплачен
    if order.status != OrderStatus.pending:
        logger.warning(f"⚠️ Заказ #{order.id} уже имеет статус {order.status}")
        return {"status": "OK"}  # Возвращаем OK чтобы RoboKassa не слал повторно

    # Обновляем заказ
    try:
        order.status = OrderStatus.processing  # Сразу в обработку
        order.transaction_id = f"robokassa_{inv_id}_{out_sum}"

        db.commit()
        db.refresh(order)

        logger.info(f"✅ Заказ #{order.id} помечен как оплаченный и отправлен в обработку")

        # Уведомление админам в Telegram
        user_info = f"👤 {order.user.username}" if order.user else "👤 Гость"
        game_info = f"🎮 {order.game.name}" if order.game else "🎮 Неизвестная игра"
        product_info = f"📦 {order.product.name}" if order.product else "📦 Неизвестный товар"

        notify_payment_sync(
            f"💰 <b>Успешная оплата через RoboKassa!</b>\n\n"
            f"🔢 Заказ: <code>#{order.id}</code>\n"
            f"{user_info}\n"
            f"{game_info}\n"
            f"{product_info}\n"
            f"💵 Сумма: <b>{order.amount} {order.currency}</b>\n"
            f"💳 Способ: RoboKassa\n"
            f"🆔 Транзакция: <code>{order.transaction_id}</code>"
        )

        # Отправляем email пользователю если есть
        if order.user and order.user.email:
            html = render_template("order_paid.html", {
                "order_id": order.id,
                "amount": order.amount,
                "currency": order.currency,
                "username": order.user.username,
                "transaction_id": order.transaction_id
            })
            send_email(
                to=order.user.email,
                subject="💳 Заказ оплачен | Donate Raid",
                body=html
            )
            logger.info(f"📧 Отправлено уведомление на {order.user.email}")

        return {"status": "OK"}

    except Exception as e:
        logger.error(f"❌ Ошибка обновления заказа #{order.id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")


@router.get("/success/{order_id}")
async def robokassa_success(order_id: int, db: Session = Depends(get_db)):
    """
    Success URL - пользователь попадает сюда после успешной оплаты
    Просто перенаправляем на страницу заказа
    """
    logger.info(f"✅ Success redirect для заказа #{order_id}")

    # Можно добавить дополнительную логику если нужно
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        logger.info(f"📋 Заказ #{order_id} найден, статус: {order.status}")

    # Frontend сам отобразит актуальную информацию о заказе
    return {"status": "success", "order_id": order_id}


@router.get("/fail/{order_id}")
async def robokassa_fail(order_id: int, db: Session = Depends(get_db)):
    """
    Fail URL - пользователь попадает сюда при неудачной оплате
    """
    logger.info(f"❌ Fail redirect для заказа #{order_id}")

    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        logger.info(f"📋 Заказ #{order_id} найден, статус: {order.status}")

    return {"status": "failed", "order_id": order_id}


@router.get("/payment-methods")
async def get_payment_methods():
    """Получить информацию о способах оплаты через RoboKassa"""
    return robokassa_service.get_payment_methods()