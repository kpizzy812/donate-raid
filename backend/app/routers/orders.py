# backend/app/routers/orders.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОДДЕРЖКОЙ ГОСТЕЙ

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.services.auth import get_current_user
from app.models.order import Order, OrderStatus, PaymentMethod
from app.models.user import User
from app.models.product import Product
from app.services.referral import ReferralService
from app.models.referral import ReferralEarning
from app.schemas.order import OrderCreate, OrderRead
from app.services.mailer import send_email, render_template
from bot.notify import notify_manual_order_sync
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from decimal import Decimal
from app.services.robokassa import robokassa_service

router = APIRouter()


# ------------------------------------------------------------
# НОВЫЕ СХЕМЫ ДЛЯ ГОСТЕВЫХ ЗАКАЗОВ
# ------------------------------------------------------------
class GuestOrderItem(BaseModel):
    game_id: int
    product_id: int
    amount: Decimal
    currency: str
    payment_method: PaymentMethod
    comment: str | None = None


class GuestOrderBulkCreate(BaseModel):
    items: List[GuestOrderItem]
    guest_email: EmailStr
    guest_name: Optional[str] = None


# ------------------------------------------------------------
# 1) Endpoints для "мои заказы" (GET /me) — только для авторизованных
# ------------------------------------------------------------
@router.get("/me", response_model=list[OrderRead])
def get_my_orders(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    print("▶▶▶ Вызван get_my_orders для user_id =", current_user.id)
    orders = (
        db.query(Order)
        .filter_by(user_id=current_user.id)
        .options(joinedload(Order.game), joinedload(Order.product))
        .order_by(Order.created_at.desc())
        .all()
    )
    print(f"    → Вернулось {len(orders)} заказов для user_id={current_user.id}")
    return orders


# ------------------------------------------------------------
# 2) Endpoint для одного заказа (GET /{order_id}) — доступно всем
# ------------------------------------------------------------
@router.get("/{order_id}", response_model=OrderRead)
def get_order(
        order_id: int,
        db: Session = Depends(get_db)
):
    print(f"▶▶▶ Вызван get_order, пытаемся найти заказ с order_id = {order_id}")
    order = (
        db.query(Order)
        .options(joinedload(Order.game), joinedload(Order.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        print(f"    → Заказ с id={order_id} не найден, верну 404")
        raise HTTPException(status_code=404, detail="Order not found")
    print(f"    → Заказ найден: id={order.id}, статус={order.status}")
    return order


# ------------------------------------------------------------
# 3) Endpoint для создания заказа авторизованным пользователем (POST /)
# ------------------------------------------------------------
@router.post("", response_model=OrderRead)
def create_order(
        order_data: OrderCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    print(f"▶▶▶ Вызван create_order для user_id={current_user.id} c данными: {order_data.dict()}")
    new_order = Order(**order_data.dict())
    new_order.user_id = current_user.id

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    print(f"    → Новый заказ создан, id={new_order.id}, статус={new_order.status}")

    # Если заказ сразу помечается как оплаченный (например, для автоматических платежей)
    if new_order.status == OrderStatus.paid:
        try:
            ReferralService.process_referral_earning(db, new_order)
        except Exception as e:
            print(f"Ошибка при обработке реферальной выплаты: {e}")

    if current_user.email:
        html = render_template("order_created.html", {
            "order_id": new_order.id,
            "amount": new_order.amount,
            "currency": new_order.currency,
            "username": current_user.username,
        })
        send_email(
            to=current_user.email,
            subject="✅ Заказ создан | Donate Raid",
            body=html
        )
        print(f"    → Отправлено письмо пользователю {current_user.email}")

    return new_order


# ------------------------------------------------------------
# 4) Endpoint для отмены заказа (POST /{order_id}/cancel)
# ------------------------------------------------------------
@router.post("/{order_id}/cancel")
def cancel_order(
        order_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    print(f"▶▶▶ Вызван cancel_order: order_id={order_id}, user_id={current_user.id}")
    order = db.query(Order).filter_by(id=order_id, user_id=current_user.id).first()

    if not order:
        print(f"    → Нету заказа с id={order_id} или он не принадлежит user_id={current_user.id}")
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.pending:
        print(f"    → Нельзя отменить заказ id={order_id}, статус={order.status}")
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")

    # Возврат баланса юзеру
    current_user.balance += order.amount
    order.status = OrderStatus.canceled
    db.commit()

    print(f"    → Заказ id={order_id} помечен canceled, баланс user_id={current_user.id} пополнен на {order.amount}")

    if current_user.email:
        html = render_template("order_cancelled.html", {
            "order_id": order.id,
            "amount": order.amount,
            "currency": order.currency,
            "username": current_user.username,
        })
        send_email(
            to=current_user.email,
            subject="❌ Заказ отменён | Donate Raid",
            body=html
        )
        print(f"    → Отправлено письмо об отмене заказа пользователю {current_user.email}")

    return {
        "status": "cancelled",
        "refunded_amount": float(order.amount),
        "currency": order.currency
    }


# ------------------------------------------------------------
# 5) Endpoint для ручного заказа (POST /manual)
# ------------------------------------------------------------
@router.post("/manual", response_model=OrderRead)
def create_manual_order(
        data: OrderCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    print(f"▶▶▶ Вызван create_manual_order для user_id={current_user.id} c данными: {data.dict()}")
    if not data.manual_game_name:
        print("    → manual_game_name не передан, верну 400")
        raise HTTPException(status_code=400, detail="manual_game_name is required for manual orders")

    # Автоматически получаем или создаем фиктивные записи для manual заказов
    from app.models.game import Game
    from app.models.product import Product, ProductType

    # Ищем или создаем системную игру для manual заказов
    dummy_game = db.query(Game).filter_by(name="Manual Orders").first()
    if not dummy_game:
        dummy_game = Game(
            name="Manual Orders",
            banner_url="",
            auto_support=False,
            sort_order=999999,
            enabled=False
        )
        db.add(dummy_game)
        db.flush()
        print(f"    → Создана системная игра для manual заказов с ID: {dummy_game.id}")

    # Ищем или создаем системный продукт
    dummy_product = db.query(Product).filter_by(
        game_id=dummy_game.id,
        name="Manual Order Service"
    ).first()
    if not dummy_product:
        dummy_product = Product(
            game_id=dummy_game.id,
            name="Manual Order Service",
            price_rub=Decimal("0.00"),
            type=ProductType.service,
            description="Системный продукт для ручных заказов",
            enabled=False,
            delivery="manual",
            sort_order=999999
        )
        db.add(dummy_product)
        db.flush()
        print(f"    → Создан системный продукт для manual заказов с ID: {dummy_product.id}")

    # Создаем заказ с автоматически подставленными ID
    order_data_dict = data.dict()
    if not order_data_dict.get('game_id'):
        order_data_dict['game_id'] = dummy_game.id
    if not order_data_dict.get('product_id'):
        order_data_dict['product_id'] = dummy_product.id

    new_order = Order(**order_data_dict)
    new_order.user_id = current_user.id
    new_order.payment_method = PaymentMethod.manual

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    print(f"    → Новый ручной заказ создан, id={new_order.id}, игра={data.manual_game_name}")

    # Telegram уведомление с order_id
    notify_manual_order_sync(
        f"📥 <b>Новая ручная заявка #{new_order.id}</b>\n"
        f"👤 <b>{current_user.username or 'No username'}</b> (ID: {current_user.id})\n"
        f"🎮 Игра: <code>{data.manual_game_name}</code>\n"
        f"💵 Сумма: {data.amount} {data.currency}\n"
        f"📝 Комментарий: {data.comment or '-'}",
        order_id=new_order.id
    )
    print(f"    → Отправлено Telegram-уведомление о новом ручном заказе #{new_order.id}")

    return new_order


# ------------------------------------------------------------
# 6) Endpoint для просмотра только ручных заказов (GET /manual/me)
# ------------------------------------------------------------
@router.get("/manual/me", response_model=list[OrderRead])
def get_my_manual_orders(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    print(f"▶▶▶ Вызван get_my_manual_orders для user_id={current_user.id}")
    orders = (
        db.query(Order)
        .filter_by(user_id=current_user.id, payment_method=PaymentMethod.manual)
        .order_by(Order.created_at.desc())
        .all()
    )
    print(f"    → Вернулось {len(orders)} ручных заказов")
    return orders


# ------------------------------------------------------------
# 7) Endpoint для массового создания заказов авторизованными (POST /bulk)
# ------------------------------------------------------------
class OrderItem(BaseModel):
    game_id: int
    product_id: int
    amount: Decimal
    currency: str
    payment_method: PaymentMethod
    comment: str | None = None


class OrderBulkCreate(BaseModel):
    items: List[OrderItem]


@router.post("/bulk", response_model=OrderRead)
def create_bulk_order(
        data: OrderBulkCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    print(f"▶▶▶ Вызван create_bulk_order для user_id={current_user.id} c items={len(data.items)}")
    if not data.items:
        print("    → items пустой, верну 400")
        raise HTTPException(status_code=400, detail="No items provided")

    total_amount = sum([item.amount for item in data.items])
    first_item = data.items[0]

    new_order = Order(
        user_id=current_user.id,
        game_id=first_item.game_id,
        product_id=first_item.product_id,
        amount=total_amount,
        currency=first_item.currency,
        payment_method=first_item.payment_method,
        comment="\n".join([f"[{i.product_id}] {i.comment or ''}" for i in data.items])
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    print(f"    → Новый bulk-заказ создан, id={new_order.id}, сумма={total_amount}, метод={first_item.payment_method}")

    # Генерируем payment_url для RoboKassa методов
    payment_url = None
    if first_item.payment_method in [PaymentMethod.sberbank, PaymentMethod.sbp]:
        try:
            # Создаем описание товара
            product_names = []
            for item in data.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product_names.append(product.name)
                else:
                    product_names.append(f"Товар #{item.product_id}")

            description = f"Заказ #{new_order.id}: " + ", ".join(product_names[:3])
            if len(product_names) > 3:
                description += f" и еще {len(product_names) - 3} товар(ов)"

            payment_url = robokassa_service.create_payment_url(
                order_id=new_order.id,
                amount=total_amount,
                currency=first_item.currency,
                description=description
            )
            print(f"    → Создан URL для оплаты: {payment_url}")
        except Exception as e:
            print(f"    → Ошибка создания URL для оплаты: {e}")

    # Возвращаем результат с payment_url если есть
    result_dict = {
        "id": new_order.id,
        "user_id": new_order.user_id,
        "game_id": new_order.game_id,
        "product_id": new_order.product_id,
        "amount": new_order.amount,
        "currency": new_order.currency,
        "payment_method": new_order.payment_method,
        "status": new_order.status,
        "comment": new_order.comment,
        "created_at": new_order.created_at,
    }

    if payment_url:
        result_dict["payment_url"] = payment_url

    return result_dict


# ------------------------------------------------------------
# 8) НОВЫЙ Endpoint для гостевых bulk заказов (POST /guest/bulk)
# ------------------------------------------------------------
@router.post("/guest/bulk", response_model=OrderRead)
def create_guest_bulk_order(
        data: GuestOrderBulkCreate,
        db: Session = Depends(get_db)
):
    """Создание bulk заказа для неавторизованного пользователя"""
    print(f"▶▶▶ Вызван create_guest_bulk_order для гостя {data.guest_email} c items={len(data.items)}")

    if not data.items:
        print("    → items пустой, верну 400")
        raise HTTPException(status_code=400, detail="No items provided")

    total_amount = sum([item.amount for item in data.items])
    first_item = data.items[0]

    # Создаем гостевую информацию для хранения в comment
    guest_info = {
        "guest_email": data.guest_email,
        "guest_name": data.guest_name,
        "items": []
    }

    # Добавляем информацию о каждом товаре
    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        guest_info["items"].append({
            "product_id": item.product_id,
            "product_name": product.name if product else f"Товар #{item.product_id}",
            "amount": float(item.amount),
            "comment": item.comment
        })

    # Объединяем пользовательские данные с гостевой информацией
    items_comments = []
    for item in data.items:
        if item.comment:
            try:
                # Парсим JSON из комментария (данные из формы)
                user_data = json.loads(item.comment)
                items_comments.append(f"[Товар #{item.product_id}] {json.dumps(user_data, ensure_ascii=False)}")
            except:
                # Если не JSON, просто добавляем как есть
                items_comments.append(f"[Товар #{item.product_id}] {item.comment}")

    # Формируем итоговый комментарий
    final_comment = json.dumps(guest_info, ensure_ascii=False)
    if items_comments:
        final_comment += "\n\nДанные форм:\n" + "\n".join(items_comments)

    # Создаем заказ БЕЗ user_id (гостевой заказ)
    new_order = Order(
        user_id=None,  # Гостевой заказ
        game_id=first_item.game_id,
        product_id=first_item.product_id,
        amount=total_amount,
        currency=first_item.currency,
        payment_method=first_item.payment_method,
        comment=final_comment,
        status=OrderStatus.pending
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    print(f"    → Новый гостевой bulk-заказ создан, id={new_order.id}, сумма={total_amount}, email={data.guest_email}")

    # Генерируем payment_url для RoboKassa методов
    payment_url = None
    if first_item.payment_method in [PaymentMethod.sberbank, PaymentMethod.sbp]:
        try:
            # Создаем описание товара для гостя
            product_names = []
            for item in data.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product_names.append(product.name)
                else:
                    product_names.append(f"Товар #{item.product_id}")

            description = f"Заказ #{new_order.id}: " + ", ".join(product_names[:3])
            if len(product_names) > 3:
                description += f" и еще {len(product_names) - 3} товар(ов)"

            payment_url = robokassa_service.create_payment_url(
                order_id=new_order.id,
                amount=total_amount,
                currency=first_item.currency,
                description=description
            )
            print(f"    → Создан URL для оплаты: {payment_url}")
        except Exception as e:
            print(f"    → Ошибка создания URL для оплаты: {e}")

    # Отправляем email гостю
    try:
        payment_method_names = {
            PaymentMethod.sberbank: "Банковская карта",
            PaymentMethod.sbp: "СБП",
            PaymentMethod.ton: "TON",
            PaymentMethod.usdt: "USDT TON",
            PaymentMethod.manual: "Ручная оплата"
        }

        html = render_template("guest_order_created.html", {
            "order_id": new_order.id,
            "amount": total_amount,
            "currency": first_item.currency,
            "payment_method": payment_method_names.get(first_item.payment_method, first_item.payment_method.value),
            "guest_email": data.guest_email,
            "guest_name": data.guest_name,
            "created_at": new_order.created_at.strftime("%d.%m.%Y %H:%M")
        })

        send_email(
            to=data.guest_email,
            subject=f"✅ Заказ #{new_order.id} создан | Donate Raid",
            body=html
        )
        print(f"    → Отправлено email гостю {data.guest_email}")
    except Exception as e:
        print(f"    → Ошибка отправки email: {e}")

    # Отправляем уведомление в Telegram
    try:
        items_info = []
        for item in data.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            product_name = product.name if product else f"Товар #{item.product_id}"
            items_info.append(f"• {product_name} - {item.amount} {item.currency}")

        telegram_message = (
                f"🛒 <b>Новый гостевой заказ #{new_order.id}</b>\n\n"
                f"📧 Email: <code>{data.guest_email}</code>\n"
                f"👤 Имя: {data.guest_name or 'Не указано'}\n"
                f"💳 Способ оплаты: {first_item.payment_method.value}\n"
                f"💵 Общая сумма: <b>{total_amount} {first_item.currency}</b>\n\n"
                f"📦 Товары:\n" + "\n".join(items_info)
        )

        notify_manual_order_sync(telegram_message, order_id=new_order.id)
        print(f"    → Отправлено Telegram-уведомление о гостевом заказе #{new_order.id}")
    except Exception as e:
        print(f"    → Ошибка отправки Telegram-уведомления: {e}")

    # Возвращаем заказ с payment_url если есть
    result_dict = {
        "id": new_order.id,
        "user_id": new_order.user_id,
        "game_id": new_order.game_id,
        "product_id": new_order.product_id,
        "amount": new_order.amount,
        "currency": new_order.currency,
        "payment_method": new_order.payment_method,
        "status": new_order.status,
        "comment": new_order.comment,
        "created_at": new_order.created_at,
    }

    if payment_url:
        result_dict["payment_url"] = payment_url

    return result_dict