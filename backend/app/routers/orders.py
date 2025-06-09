# app/api/orders.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.services.auth import get_current_user
from app.models.order import Order, OrderStatus, PaymentMethod
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead
from app.services.mailer import send_email, render_template
from bot.notify import notify_manual_order_sync
from pydantic import BaseModel
from typing import List
from decimal import Decimal

router = APIRouter()


# ------------------------------------------------------------
# 1) Endpoints для “мои заказы” (GET /me) — логируем при входе
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
# 2) Endpoint для одного заказа (GET /{order_id}) — логируем param
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
# 3) Endpoint для создания заказа (POST /)
# ------------------------------------------------------------
@router.post("/", response_model=OrderRead)
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

    new_order = Order(**data.dict())
    new_order.user_id = current_user.id
    new_order.payment_method = PaymentMethod.manual
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    print(f"    → Новый ручной заказ создан, id={new_order.id}, игра={data.manual_game_name}")

    # 🔔 Telegram уведомление
    notify_manual_order_sync(
        f"📥 <b>Новая ручная заявка</b>\n"
        f"👤 <b>{current_user.username or 'No username'}</b> (ID: {current_user.id})\n"
        f"🎮 Игра: <code>{data.manual_game_name}</code>\n"
        f"💵 Сумма: {data.amount} {data.currency}\n"
        f"📝 Комментарий: {data.comment or '-'}"
    )
    print(f"    → Отправлено Telegram-уведомление о новом ручном заказе")

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
# 7) Endpoint для массового создания (POST /bulk)
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
    print(f"▶▶▶ Вызван create_bulk_order для user_id={current_user.id} c items={data.items}")
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

    print(f"    → Новый bulk-заказ создан, id={new_order.id}, сумма={total_amount}")

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
