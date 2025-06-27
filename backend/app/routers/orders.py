# app/api/orders.py

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
from pydantic import BaseModel
from typing import List
from decimal import Decimal
from app.services.robokassa import robokassa_service

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

    # # Если заказ сразу помечается как оплаченный (например, для автоматических платежей)
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

    # 🆕 Автоматически получаем или создаем фиктивные записи для manual заказов
    from app.models.game import Game
    from app.models.product import Product, ProductType

    # Ищем или создаем системную игру для manual заказов
    dummy_game = db.query(Game).filter_by(name="Manual Orders").first()
    if not dummy_game:
        dummy_game = Game(
            name="Manual Orders",
            banner_url="",
            auto_support=False,
            sort_order=999999,  # В самый конец
            enabled=False  # Скрываем от пользователей
        )
        db.add(dummy_game)
        db.flush()  # Получаем ID
        print(f"    → Создана системная игра для manual заказов с ID: {dummy_game.id}")

    # Ищем или создаем системный продукт
    dummy_product = db.query(Product).filter_by(
        game_id=dummy_game.id,
        name="Manual Order Service"
    ).first()
    if not dummy_product:
        from decimal import Decimal
        dummy_product = Product(
            game_id=dummy_game.id,
            name="Manual Order Service",
            price_rub=Decimal("0.00"),
            type=ProductType.service,
            description="Системный продукт для ручных заказов",
            enabled=False,  # Скрываем от пользователей
            delivery="manual",
            sort_order=999999
        )
        db.add(dummy_product)
        db.flush()
        print(f"    → Создан системный продукт для manual заказов с ID: {dummy_product.id}")

    # 🆕 Создаем заказ с автоматически подставленными ID
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

    # 🔔 Telegram уведомление с order_id
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
        payment_method=first_item.payment_method,  # 🆕 Теперь получаем реальное значение
        comment="\n".join([f"[{i.product_id}] {i.comment or ''}" for i in data.items])
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    print(f"    → Новый bulk-заказ создан, id={new_order.id}, сумма={total_amount}, метод={first_item.payment_method}")

    # 🆕 Генерируем payment_url для RoboKassa методов
    if first_item.payment_method in [PaymentMethod.sberbank, PaymentMethod.sbp]:
        try:
            # Создаем описание товара
            product_names = []
            for item in data.items:
                # Пытаемся получить информацию о продукте
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product_names.append(product.name)
                else:
                    product_names.append(f"Товар #{item.product_id}")

            description = f"Заказ #{new_order.id}: " + ", ".join(product_names[:3])
            if len(product_names) > 3:
                description += f" и еще {len(product_names) - 3} товар(ов)"

            # Генерируем URL для оплаты
            payment_url = robokassa_service.create_payment_url(
                order_id=new_order.id,
                amount=total_amount,
                currency=first_item.currency,
                description=description
            )

            # Сохраняем URL в заказ
            new_order.payment_url = payment_url
            db.commit()
            db.refresh(new_order)

            print(f"    → Сгенерирован payment_url для RoboKassa: {payment_url}")

        except Exception as e:
            print(f"    → Ошибка генерации payment_url: {e}")
            # Не прерываем создание заказа из-за ошибки генерации URL

    # Отправка email уведомления
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


@router.post("/{order_id}/mark-paid")
def mark_order_as_paid(
        order_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Помечает заказ как оплаченный и обрабатывает реферальную выплату
    Этот endpoint должен вызываться платежной системой или администратором
    """
    print(f"▶▶▶ Помечаем заказ {order_id} как оплаченный")

    order = db.query(Order).filter_by(id=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.pending:
        raise HTTPException(
            status_code=400,
            detail=f"Заказ уже имеет статус {order.status.value}"
        )

    # Обновляем статус заказа
    order.status = OrderStatus.paid
    db.commit()

    print(f"    → Заказ {order_id} помечен как оплаченный")

    # Обрабатываем реферальную выплату
    try:
        referral_earning = ReferralService.process_referral_earning(db, order)
        if referral_earning:
            print(
                f"    → Реферальная выплата {referral_earning.amount} произведена пользователю {referral_earning.referrer_id}")
        else:
            print(f"    → Реферальная выплата не требуется для заказа {order_id}")
    except Exception as e:
        print(f"    → Ошибка при обработке реферальной выплаты: {e}")
        # Не прерываем выполнение, если реферальная система дала сбой

    # Отправляем email об успешной оплате
    if order.user and order.user.email:
        html = render_template("order_success.html", {
            "order_id": order.id,
            "product_name": order.product.name if order.product else "Товар",
            "amount": order.amount,
            "currency": order.currency,
            "username": order.user.username,
        })
        send_email(
            to=order.user.email,
            subject="✅ Заказ оплачен | Donate Raid",
            body=html
        )
        print(f"    → Отправлено письмо об успешной оплате пользователю {order.user.email}")

    return {
        "status": "paid",
        "order_id": order.id,
        "referral_bonus": float(referral_earning.amount) if referral_earning else 0
    }

@router.get("/referral-stats")
def get_order_referral_stats(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Получить статистику заказов, связанных с рефералами"""

    # Заказы, по которым пользователь получил реферальные выплаты
    referral_orders = db.query(Order).join(ReferralEarning).filter(
        ReferralEarning.referrer_id == current_user.id
    ).all()

    total_referral_orders = len(referral_orders)
    total_referral_amount = sum(order.amount for order in referral_orders)

    return {
        "total_referral_orders": total_referral_orders,
        "total_referral_amount": float(total_referral_amount),
        "recent_referral_orders": [
            {
                "id": order.id,
                "amount": float(order.amount),
                "currency": order.currency,
                "created_at": order.created_at.isoformat()
            }
            for order in referral_orders[-10:]  # Последние 10 заказов
        ]
    }