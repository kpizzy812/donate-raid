from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.order import Order, OrderStatus
from app.models.user import User
from bot.states.manual_orders import ApproveOrderState, RefundOrderState

router = Router()

def get_db() -> Session:
    return SessionLocal()

# 💬 Кнопки для админа
def manual_order_keyboard(order_id: int):
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Принять", callback_data=f"approve_{order_id}")
    kb.button(text="↩️ Отклонить с возвратом", callback_data=f"reject_with_refund_{order_id}")
    kb.button(text="❌ Отклонить без возврата", callback_data=f"reject_no_refund_{order_id}")
    kb.adjust(1)
    return kb.as_markup()

# ✅ Принятие заказа
@router.callback_query(F.data.startswith("approve_"))
async def approve_manual_order_start(call: CallbackQuery, state: FSMContext):
    await state.set_state(ApproveOrderState.amount)
    order_id = int(call.data.split("_")[1])
    await state.update_data(order_id=order_id)
    await call.message.answer("💰 Введите сумму, которую подтвердил клиент:")
    await call.answer()

@router.message(ApproveOrderState.amount)
async def approve_manual_order_amount(msg: Message, state: FSMContext):
    data = await state.get_data()
    order_id = data["order_id"]
    try:
        amount = float(msg.text)
    except ValueError:
        return await msg.answer("❌ Введите корректную сумму.")

    db = get_db()
    order = db.query(Order).get(order_id)
    if not order or order.status != OrderStatus.pending:
        return await msg.answer("❌ Заявка не найдена или уже обработана.")

    order.status = OrderStatus.completed
    order.amount = amount
    db.commit()

    await msg.answer(f"✅ Заявка #{order.id} подтверждена на сумму {amount} {order.currency}")
    await state.clear()

# ↩️ Отклонить с возвратом
@router.callback_query(F.data.startswith("reject_with_refund_"))
async def reject_with_refund_start(call: CallbackQuery, state: FSMContext):
    await state.set_state(RefundOrderState.amount)
    order_id = int(call.data.split("_")[-1])
    await state.update_data(order_id=order_id)
    await call.message.answer("💸 Введите сумму возврата:")
    await call.answer()

@router.message(RefundOrderState.amount)
async def reject_with_refund_amount(msg: Message, state: FSMContext):
    data = await state.get_data()
    order_id = data["order_id"]
    try:
        refund = float(msg.text)
    except ValueError:
        return await msg.answer("❌ Введите корректную сумму.")

    db = get_db()
    order = db.query(Order).get(order_id)
    user = db.query(User).get(order.user_id)

    if not order or order.status != OrderStatus.pending:
        return await msg.answer("❌ Заявка не найдена или уже обработана.")

    user.balance += refund
    order.status = OrderStatus.canceled
    db.commit()

    await msg.answer(f"↩️ Заявка #{order.id} отклонена. Возврат: {refund} {order.currency}")
    await state.clear()

# ❌ Отклонить без возврат
@router.callback_query(F.data.startswith("reject_no_refund_"))
async def reject_without_refund(call: CallbackQuery):
    order_id = int(call.data.split("_")[-1])
    db = get_db()
    order = db.query(Order).get(order_id)

    if not order or order.status != OrderStatus.pending:
        return await call.message.answer("❌ Заявка не найдена или уже обработана.")

    order.status = OrderStatus.canceled
    db.commit()

    await call.message.answer(f"❌ Заявка #{order.id} отклонена без возврата.")
    await call.answer()
