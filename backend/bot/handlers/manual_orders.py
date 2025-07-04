from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.order import Order, OrderStatus
from app.models.user import User
from bot.states.manual_orders import ApproveOrderState, RefundOrderState
from decimal import Decimal  # ДОБАВЛЕН ИМПОРТ

router = Router()


def get_db() -> Session:
    return SessionLocal()


# 💬 Кнопки для админа
def manual_order_keyboard(order_id: int):
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Принять", callback_data=f"approve_{order_id}")
    kb.button(text="↩️ Отклонить с возвратом", callback_data=f"reject_with_refund_{order_id}")
    kb.button(text="❌ Удалить", callback_data=f"delete_order_{order_id}")
    kb.adjust(1)
    return kb.as_markup()


# ✅ Принятие заказа
@router.callback_query(F.data.startswith("approve_"))
async def approve_manual_order(call: CallbackQuery):
    order_id = int(call.data.split("_")[1])

    db = get_db()
    try:
        order = db.query(Order).get(order_id)
        if not order or order.status != OrderStatus.pending:
            await call.message.answer("❌ Заявка не найдена или уже обработана.")
            await call.answer()
            return

        # Меняем статус на completed (done)
        order.status = OrderStatus.done
        db.commit()

        # Получаем информацию о пользователе
        user = db.query(User).get(order.user_id)
        username = user.username or user.email or f"ID: {user.id}" if user else "Неизвестный"

        await call.message.edit_text(
            f"✅ <b>Заявка #{order.id} принята и выполнена</b>\n\n"
            f"👤 Пользователь: {username}\n"
            f"🎮 Игра: <code>{order.manual_game_name}</code>\n"
            f"💵 Сумма: {order.amount} {order.currency}\n"
            f"📅 Обработано: сейчас",
            parse_mode="HTML"
        )
        await call.answer("✅ Заявка принята!")

    except Exception as e:
        await call.message.answer(f"❌ Ошибка при обработке заявки: {e}")
        await call.answer()
    finally:
        db.close()


# ↩️ Отклонить с возвратом
@router.callback_query(F.data.startswith("reject_with_refund_"))
async def reject_with_refund_start(call: CallbackQuery, state: FSMContext):
    order_id = int(call.data.split("_")[-1])

    db = get_db()
    try:
        order = db.query(Order).get(order_id)
        if not order or order.status != OrderStatus.pending:
            await call.message.answer("❌ Заявка не найдена или уже обработана.")
            await call.answer()
            return

        await state.set_state(RefundOrderState.amount)
        await state.update_data(order_id=order_id)
        await call.message.answer(
            f"💸 Введите сумму возврата для заявки #{order_id} (максимум {order.amount} {order.currency}):")
        await call.answer()

    except Exception as e:
        await call.message.answer(f"❌ Ошибка: {e}")
        await call.answer()
    finally:
        db.close()


@router.message(RefundOrderState.amount)
async def reject_with_refund_amount(msg: Message, state: FSMContext):
    data = await state.get_data()
    order_id = data["order_id"]

    # ПРИНУДИТЕЛЬНО ОЧИЩАЕМ СОСТОЯНИЕ В НАЧАЛЕ
    await state.clear()

    try:
        refund = float(msg.text.strip())
        if refund <= 0:
            return await msg.answer("❌ Сумма должна быть больше 0.")
    except ValueError:
        return await msg.answer("❌ Введите корректную сумму. Используйте только цифры.")

    db = get_db()
    try:
        order = db.query(Order).get(order_id)
        if not order:
            return await msg.answer("❌ Заявка не найдена.")

        if order.status != OrderStatus.pending:
            return await msg.answer(f"❌ Заявка уже обработана. Статус: {order.status.value}")

        user = db.query(User).get(order.user_id)
        if not user:
            return await msg.answer("❌ Пользователь не найден.")

        if refund > float(order.amount):
            return await msg.answer(
                f"❌ Сумма возврата ({refund}) не может превышать сумму заказа ({order.amount} {order.currency})")

        # Выполняем возврат
        old_balance = user.balance or Decimal('0')
        user.balance = old_balance + Decimal(str(refund))
        order.status = OrderStatus.canceled

        # Принудительно коммитим изменения
        db.commit()
        db.refresh(user)
        db.refresh(order)

        username = user.username or user.email or f"ID: {user.id}"

        await msg.answer(
            f"✅ <b>Заявка #{order.id} отклонена с возвратом</b>\n\n"
            f"👤 Пользователь: {username}\n"
            f"💸 Возврат: {refund} {order.currency}\n"
            f"💰 Баланс был: {old_balance}\n"
            f"💰 Баланс стал: {user.balance}\n"
            f"📅 Время: сейчас",
            parse_mode="HTML"
        )

        print(f"[SUCCESS] Refund processed: Order #{order_id}, Amount: {refund}, User: {username}")

    except Exception as e:
        print(f"[ERROR] Refund failed: {e}")
        db.rollback()
        await msg.answer(f"❌ Ошибка при возврате: {str(e)}")
    finally:
        db.close()


# ❌ Удалить заявку
@router.callback_query(F.data.startswith("delete_order_"))
async def delete_manual_order(call: CallbackQuery):
    order_id = int(call.data.split("_")[-1])

    db = get_db()
    try:
        order = db.query(Order).get(order_id)
        if not order:
            await call.message.answer("❌ Заявка не найдена.")
            await call.answer()
            return

        user = db.query(User).get(order.user_id)
        username = user.username or user.email or f"ID: {user.id}" if user else "Неизвестный"

        # Удаляем заявку из базы
        db.delete(order)
        db.commit()

        await call.message.edit_text(
            f"🗑️ <b>Заявка #{order_id} удалена</b>\n\n"
            f"👤 Пользователь: {username}\n"
            f"🎮 Игра: <code>{order.manual_game_name}</code>\n"
            f"💵 Сумма: {order.amount} {order.currency}\n"
            f"📅 Удалено: сейчас",
            parse_mode="HTML"
        )
        await call.answer("🗑️ Заявка удалена!")

    except Exception as e:
        await call.message.answer(f"❌ Ошибка при удалении заявки: {e}")
        await call.answer()
    finally:
        db.close()