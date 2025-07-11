# backend/app/routers/robokassa.py
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.services.robokassa import robokassa_service
from app.services.telegram import notify_payment_sync
from app.services.mailer import send_email, render_template
from loguru import logger
from fastapi.responses import RedirectResponse
from typing import Dict
from sqlalchemy.orm import joinedload

router = APIRouter()


@router.post("/result")
async def robokassa_result(request: Request, db: Session = Depends(get_db)):
    """
    Webhook для уведомлений от RoboKassa о статусе платежа (Result URL)
    Этот endpoint вызывается RoboKassa для уведомления о результате оплаты
    """
    logger.info("🔔 Получен Result webhook от RoboKassa")

    # Логируем заголовки для отладки
    logger.info(f"📋 Content-Type: {request.headers.get('content-type')}")
    logger.info(f"📋 User-Agent: {request.headers.get('user-agent')}")

    # ИСПРАВЛЕНО: более надежная обработка данных от RoboKassa
    data = {}
    try:
        content_type = request.headers.get("content-type", "").lower()

        # Сначала пытаемся получить данные как form data (основной способ RoboKassa)
        if "application/x-www-form-urlencoded" in content_type or not content_type:
            form_data = await request.form()
            data = dict(form_data)
            logger.info("📥 Данные получены как form data")
        else:
            # Если не form data, пытаемся как JSON (резервный способ)
            try:
                data = await request.json()
                logger.info("📥 Данные получены как JSON")
            except Exception as json_error:
                logger.warning(f"⚠️ Не удалось парсить как JSON: {json_error}")
                # Попытка получить как form data в любом случае
                try:
                    form_data = await request.form()
                    data = dict(form_data)
                    logger.info("📥 Данные получены как form data (резервно)")
                except Exception as form_error:
                    logger.error(
                        f"❌ Не удалось получить данные ни одним способом: form_error={form_error}, json_error={json_error}")

                    # Попытка получить raw данные для отладки
                    try:
                        body = await request.body()
                        logger.error(f"📄 Raw body: {body}")
                    except:
                        logger.error("❌ Не удалось получить даже raw body")

                    raise HTTPException(status_code=400, detail="Unable to parse request data")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Критическая ошибка при получении данных: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing request: {str(e)}")

    logger.info(f"📦 Данные от RoboKassa: {data}")

    # Извлекаем необходимые параметры
    try:
        out_sum = data.get("OutSum")  # Сумма
        inv_id = data.get("InvId")  # ID заказа
        signature_value = data.get("SignatureValue")  # Подпись
        fee = data.get("Fee", "0")  # Комиссия (опционально)
        email = data.get("EMail")  # Email плательщика (опционально)

        if not all([out_sum, inv_id, signature_value]):
            missing_params = []
            if not out_sum: missing_params.append("OutSum")
            if not inv_id: missing_params.append("InvId")
            if not signature_value: missing_params.append("SignatureValue")

            logger.error(f"❌ Отсутствуют обязательные параметры: {missing_params}")
            logger.error(f"📋 Все полученные данные: {data}")
            raise ValueError(f"Отсутствуют обязательные параметры: {', '.join(missing_params)}")

    except Exception as e:
        logger.error(f"❌ Ошибка парсинга данных от RoboKassa: {e}")
        raise HTTPException(status_code=400, detail="Invalid parameters")

    # Проверяем подпись
    if not robokassa_service.verify_signature_result(out_sum, inv_id, signature_value):
        logger.error("❌ Неверная подпись от RoboKassa")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Находим заказ С ПОЛЬЗОВАТЕЛЕМ
    order = db.query(Order).options(
        joinedload(Order.user),  # ДОБАВЛЕНО: загружаем пользователя
        joinedload(Order.game),
        joinedload(Order.product)
    ).filter(Order.id == int(inv_id)).first()

    if not order:
        logger.error(f"❌ Заказ #{inv_id} не найден")
        raise HTTPException(status_code=404, detail="Order not found")

    logger.info(f"📋 Найден заказ #{order.id}, текущий статус: {order.status}")

    # Проверяем, что заказ еще не оплачен
    if order.status != OrderStatus.pending:
        logger.warning(f"⚠️ Заказ #{order.id} уже имеет статус {order.status}")
        return {"status": "OK"}

    # Обновляем заказ
    try:
        order.status = OrderStatus.processing
        order.transaction_id = f"robokassa_{inv_id}_{out_sum}"

        db.commit()
        db.refresh(order)

        logger.info(f"✅ Заказ #{order.id} помечен как оплаченный и отправлен в обработку")

        # ИСПРАВЛЕНО: Улучшенное уведомление админам в Telegram
        user_info = "👤 Гость"
        if order.user:
            user_info = f"👤 {order.user.username or 'Без имени'}"
            if order.user.email:
                user_info += f" ({order.user.email})"
            user_info += f" [ID: {order.user.id}]"

        game_info = f"🎮 {order.game.name}" if order.game else "🎮 Неизвестная игра"
        product_info = f"📦 {order.product.name}" if order.product else "📦 Неизвестный товар"

        # Парсим пользовательские данные из comment
        user_data_info = ""
        if order.comment:
            try:
                import json
                import re

                # Ищем JSON в комментарии
                json_matches = re.findall(r'\{[^}]+\}', order.comment)
                if json_matches:
                    parsed_data = json.loads(json_matches[0])
                    user_data_items = []
                    for key, value in parsed_data.items():
                        user_data_items.append(f"  • {key}: {value}")

                    if user_data_items:
                        user_data_info = f"\n📝 Данные пользователя:\n" + "\n".join(user_data_items)
            except Exception as e:
                logger.warning(f"Не удалось парсить данные пользователя: {e}")

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
            f"🆔 Транзакция: <code>{order.transaction_id}</code>",
            order_id=order.id  # ДОБАВЛЕНО: передаем order_id для кнопок
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

        from fastapi.responses import PlainTextResponse
        return PlainTextResponse("OK", status_code=200)

    except Exception as e:
        logger.error(f"❌ Ошибка обновления заказа #{order.id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")


# Замените в файле backend/app/routers/robokassa.py

@router.get("/success")
@router.post("/success")  # ДОБАВЛЕНО: поддержка POST
async def robokassa_success(
        request: Request,  # ДОБАВЛЕНО: для обработки POST данных
        OutSum: str = None,
        InvId: str = None,
        SignatureValue: str = None,
        db: Session = Depends(get_db)
):
    """
    Success URL - пользователь попадает сюда после успешной оплаты
    RoboKassa может отправлять как GET, так и POST запросы
    """
    logger.info(f"✅ Success redirect от RoboKassa (метод: {request.method})")

    # Для POST запросов получаем данные из form data
    if request.method == "POST":
        try:
            form_data = await request.form()
            OutSum = form_data.get("OutSum") or OutSum
            InvId = form_data.get("InvId") or InvId
            SignatureValue = form_data.get("SignatureValue") or SignatureValue
            logger.info(f"📦 POST данные: OutSum={OutSum}, InvId={InvId}")
        except Exception as e:
            logger.warning(f"⚠️ Ошибка парсинга POST данных: {e}")
    else:
        logger.info(f"📦 GET параметры: OutSum={OutSum}, InvId={InvId}, SignatureValue={SignatureValue}")

    # Проверяем наличие InvId (ID заказа)
    if InvId:
        try:
            order_id = int(InvId)
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                logger.info(f"📋 Заказ #{order_id} найден, статус: {order.status}")

                # ИСПРАВЛЕНО: Перенаправляем на фронтенд страницу заказа
                redirect_url = f"https://donateraid.ru/order/{order_id}?payment=success"
                logger.info(f"🔄 Перенаправляем на: {redirect_url}")
                return RedirectResponse(url=redirect_url, status_code=302)
            else:
                logger.warning(f"⚠️ Заказ #{order_id} не найден")
        except ValueError:
            logger.error(f"❌ Неверный формат InvId: {InvId}")

    # Если что-то пошло не так, перенаправляем на главную
    logger.info("🏠 Перенаправляем на главную страницу")
    return RedirectResponse(url="https://donateraid.ru/", status_code=302)


@router.get("/fail")
@router.post("/fail")  # ДОБАВЛЕНО: поддержка POST для fail
async def robokassa_fail(
        request: Request,  # ДОБАВЛЕНО: для обработки POST данных
        OutSum: str = None,
        InvId: str = None,
        SignatureValue: str = None,
        db: Session = Depends(get_db)
):
    """
    Fail URL - пользователь попадает сюда при неудачной оплате
    RoboKassa может отправлять как GET, так и POST запросы
    """
    logger.info(f"❌ Fail redirect от RoboKassa (метод: {request.method})")

    # Для POST запросов получаем данные из form data
    if request.method == "POST":
        try:
            form_data = await request.form()
            OutSum = form_data.get("OutSum") or OutSum
            InvId = form_data.get("InvId") or InvId
            SignatureValue = form_data.get("SignatureValue") or SignatureValue
            logger.info(f"📦 POST данные: OutSum={OutSum}, InvId={InvId}")
        except Exception as e:
            logger.warning(f"⚠️ Ошибка парсинга POST данных: {e}")
    else:
        logger.info(f"📦 GET параметры: OutSum={OutSum}, InvId={InvId}, SignatureValue={SignatureValue}")

    # Проверяем наличие InvId (ID заказа)
    if InvId:
        try:
            order_id = int(InvId)
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                logger.info(f"📋 Заказ #{order_id} найден, статус: {order.status}")

                # ИСПРАВЛЕНО: Перенаправляем на фронтенд страницу заказа с параметром ошибки
                redirect_url = f"https://donateraid.ru/order/{order_id}?payment=failed"
                logger.info(f"🔄 Перенаправляем на: {redirect_url}")
                return RedirectResponse(url=redirect_url, status_code=302)
            else:
                logger.warning(f"⚠️ Заказ #{order_id} не найден")
        except ValueError:
            logger.error(f"❌ Неверный формат InvId: {InvId}")

    # Если что-то пошло не так, перенаправляем на главную
    logger.info("🏠 Перенаправляем на главную страницу")
    return RedirectResponse(url="https://donateraid.ru/", status_code=302)


@router.get("/payment-methods")
async def get_payment_methods():
    """Получить информацию о способах оплаты через RoboKassa"""
    return robokassa_service.get_payment_methods()