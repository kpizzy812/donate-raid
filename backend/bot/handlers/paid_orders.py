# backend/bot/handlers/paid_orders.py
from aiogram import Router, F
from aiogram.types import CallbackQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.services.mailer import send_email, render_template
from decimal import Decimal

router = Router()


def get_db() -> Session:
    return SessionLocal()


# 💬 Кнопки для админа (платные заказы)
def paid_order_keyboard(order_id: int):
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Выполнен", callback_data=f"paid_complete_{order_id}")
    kb.button(text="💸 Возврат", callback_data=f"paid_refund_{order_id}")
    kb.adjust(2)
    return kb.as_markup()


# ✅ Пометить заказ как выполненный
@router.callback_query(F.data.startswith("paid_complete_"))
async def complete_paid_order(call: CallbackQuery):
    order_id = int(call.data.split("_")[2])

    db = get_db()
    try:
        order = db.query(Order).get(order_id)
        if not order:
            await call.message.answer("❌ Заказ не найден.")
            await call.answer()
            return

        if order.status == OrderStatus.done:
            await call.message.answer("✅ Заказ уже выполнен.")
            await call.answer()
            return

        # Меняем статус на выполнен
        order.status = OrderStatus.done
        db.commit()
        db.refresh(order)

        # Получаем информацию о пользователе
        user = db.query(User).get(order.user_id)
        username = user.username or user.email or f"ID: {user.id}" if user else "Неизвестный"

        # Отправляем email пользователю
        if user and user.email:
            try:
                html = render_template("order_success.html", {
                    "order_id": order.id,
                    "product_name": order.product.name if order.product else "Неизвестный товар",
                    "amount": order.amount,
                    "currency": order.currency
                })
                send_email(
                    to=user.email,
                    subject="✅ Заказ выполнен | Donate Raid",
                    body=html
                )
            except Exception as e:
                print(f"Ошибка отправки email: {e}")

        await call.message.edit_text(
            f"✅ <b>Заказ #{order.id} выполнен</b>\n\n"
            f"👤 Пользователь: {username}\n"
            f"🎮 Игра: {order.game.name if order.game else 'Неизвестная игра'}\n"
            f"📦 Товар: {order.product.name if order.product else 'Неизвестный товар'}\n"
            f"💵 Сумма: {order.amount} {order.currency}\n"
            f"📅 Выполнено: сейчас",
            parse_mode="HTML"
        )
        await call.answer("✅ Заказ помечен как выполненный!")

    except Exception as e:
        await call.message.answer(f"❌ Ошибка при обработке заказа: {e}")
        await call.answer()
    finally:
        db.close()


# 💸 Возврат средств
@router.callback_query(F.data.startswith("paid_refund_"))
async def refund_paid_order(call: CallbackQuery):
    order_id = int(call.data.split("_")[2])

    db = get_db()
    try:
        order = db.query(Order).get(order_id)
        if not order:
            await call.message.answer("❌ Заказ не найден.")
            await call.answer()
            return

        if order.status == OrderStatus.canceled:
            await call.message.answer("❌ Заказ уже отменен.")
            await call.answer()
            return

        # Получаем пользователя
        user = db.query(User).get(order.user_id)
        if not user:
            await call.message.answer("❌ Пользователь не найден.")
            await call.answer()
            return

        # Выполняем возврат на полную сумму заказа
        refund_amount = float(order.amount)
        old_balance = user.balance or Decimal('0')
        user.balance = old_balance + Decimal(str(refund_amount))
        order.status = OrderStatus.canceled

        # Принудительно коммитим изменения
        db.commit()
        db.refresh(user)
        db.refresh(order)

        username = user.username or user.email or f"ID: {user.id}"

        # Отправляем email о возврате
        if user.email:
            try:
                html = render_template("order_refund.html", {
                    "order_id": order.id,
                    "refund_amount": refund_amount,
                    "currency": order.currency,
                    "username": user.username
                })
                send_email(
                    to=user.email,
                    subject="💸 Возврат средств | Donate Raid",
                    body=html
                )
            except Exception as e:
                print(f"Ошибка отправки email о возврате: {e}")

        await call.message.edit_text(
            f"💸 <b>Возврат по заказу #{order.id} выполнен</b>\n\n"
            f"👤 Пользователь: {username}\n"
            f"🎮 Игра: {order.game.name if order.game else 'Неизвестная игра'}\n"
            f"📦 Товар: {order.product.name if order.product else 'Неизвестный товар'}\n"
            f"💸 Возврат: {refund_amount} {order.currency}\n"
            f"💰 Баланс был: {old_balance}\n"
            f"💰 Баланс стал: {user.balance}\n"
            f"📅 Время: сейчас",
            parse_mode="HTML"
        )
        await call.answer("💸 Возврат выполнен!")

    except Exception as e:
        print(f"[ERROR] Refund failed: {e}")
        db.rollback()
        await call.message.answer(f"❌ Ошибка при возврате: {str(e)}")
        await call.answer()
    finally:
        db.close()