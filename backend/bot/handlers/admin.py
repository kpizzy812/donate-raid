# backend/bot/handlers/admin.py - НОВЫЙ ФАЙЛ С АДМИНСКИМИ КОМАНДАМИ
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from app.core.database import SessionLocal
from app.models.order import Order, OrderStatus, PaymentMethod
from app.models.user import User
from app.models.support import SupportMessage, SupportStatus
from bot.config import ADMIN_CHAT_IDS
from datetime import datetime, timedelta

router = Router()


def get_db() -> Session:
    return SessionLocal()


def is_admin(user_id: int) -> bool:
    """Проверка, является ли пользователь админом"""
    return user_id in ADMIN_CHAT_IDS


# 📊 Главное меню админки
@router.message(F.text == "/admin")
async def admin_menu(msg: Message):
    if not is_admin(msg.from_user.id):
        return await msg.answer("❌ У вас нет прав администратора")

    kb = InlineKeyboardBuilder()
    kb.button(text="📋 Ручные заявки", callback_data="admin_manual_orders")
    kb.button(text="💬 Поддержка", callback_data="admin_support")
    kb.button(text="📝 Отзывы", callback_data="admin_reviews")  # ДОБАВЛЕНО
    kb.button(text="👥 Пользователи", callback_data="admin_users")
    kb.button(text="📈 Статистика", callback_data="admin_stats")
    kb.button(text="🔄 Все заказы", callback_data="admin_all_orders")
    kb.adjust(2, 2, 2)

    await msg.answer(
        "🔧 <b>Панель администратора</b>\n\n"
        "Выберите раздел для управления:",
        reply_markup=kb.as_markup(),
        parse_mode="HTML"
    )


# 📋 Ручные заявки
@router.callback_query(F.data == "admin_manual_orders")
async def admin_manual_orders_menu(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    kb = InlineKeyboardBuilder()
    kb.button(text="🆕 Новые заявки", callback_data="manual_orders_pending")
    kb.button(text="✅ Выполненные", callback_data="manual_orders_done")
    kb.button(text="❌ Отмененные", callback_data="manual_orders_canceled")
    kb.button(text="📊 Все заявки", callback_data="manual_orders_all")
    kb.button(text="🔙 Назад", callback_data="admin_back")
    kb.adjust(2, 2, 1)

    db = get_db()
    try:
        pending_count = db.query(Order).filter(
            Order.payment_method == PaymentMethod.manual,
            Order.status == OrderStatus.pending
        ).count()

        total_count = db.query(Order).filter(
            Order.payment_method == PaymentMethod.manual
        ).count()
    finally:
        db.close()

    await call.message.edit_text(
        f"📋 <b>Управление ручными заявками</b>\n\n"
        f"🆕 Новых заявок: <b>{pending_count}</b>\n"
        f"📊 Всего заявок: <b>{total_count}</b>",
        reply_markup=kb.as_markup(),
        parse_mode="HTML"
    )
    await call.answer()


# Просмотр заявок по статусу
@router.callback_query(F.data.startswith("manual_orders_"))
async def show_manual_orders_by_status(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    status_map = {
        "manual_orders_pending": OrderStatus.pending,
        "manual_orders_done": OrderStatus.done,
        "manual_orders_canceled": OrderStatus.canceled,
        "manual_orders_all": None
    }

    status = status_map.get(call.data)
    status_name = {
        "manual_orders_pending": "Новые",
        "manual_orders_done": "Выполненные",
        "manual_orders_canceled": "Отмененные",
        "manual_orders_all": "Все"
    }.get(call.data, "Неизвестно")

    db = get_db()
    try:
        query = db.query(Order).filter(Order.payment_method == PaymentMethod.manual)
        if status:
            query = query.filter(Order.status == status)

        orders = query.order_by(desc(Order.created_at)).limit(10).all()

        if not orders:
            text = f"📋 <b>{status_name} заявки</b>\n\n📭 Заявок не найдено"
        else:
            text = f"📋 <b>{status_name} заявки</b> (последние 10)\n\n"

            for order in orders:
                user = db.query(User).get(order.user_id)
                username = user.username or user.email or f"ID:{user.id}" if user else "❓"

                emoji = {"pending": "🆕", "done": "✅", "canceled": "❌"}.get(order.status.value, "❓")

                text += (
                    f"{emoji} <b>#{order.id}</b> - {order.manual_game_name}\n"
                    f"👤 {username}\n"
                    f"💰 {order.amount} {order.currency}\n"
                    f"📅 {order.created_at.strftime('%d.%m %H:%M')}\n"
                )

                if order.comment:
                    text += f"💬 {order.comment[:50]}...\n"
                text += "\n"

        kb = InlineKeyboardBuilder()
        if status == OrderStatus.pending and orders:
            kb.button(text="⚡ Быстрые действия", callback_data="manual_quick_actions")
        kb.button(text="🔙 Назад к заявкам", callback_data="admin_manual_orders")
        kb.adjust(1)

        await call.message.edit_text(text, reply_markup=kb.as_markup(), parse_mode="HTML")
    finally:
        db.close()

    await call.answer()


# 💬 Управление поддержкой
@router.callback_query(F.data == "admin_support")
async def admin_support_menu(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    db = get_db()
    try:
        # Статистика по поддержке
        new_messages = db.query(SupportMessage).filter(
            SupportMessage.status == SupportStatus.new,
            SupportMessage.is_from_user == True
        ).count()

        active_dialogs = db.query(SupportMessage.user_id, SupportMessage.guest_id).filter(
            SupportMessage.status != SupportStatus.resolved
        ).distinct().count()

        total_messages_today = db.query(SupportMessage).filter(
            SupportMessage.created_at >= datetime.now().replace(hour=0, minute=0, second=0)
        ).count()

    finally:
        db.close()

    kb = InlineKeyboardBuilder()
    kb.button(text="🆕 Новые сообщения", callback_data="support_new_messages")
    kb.button(text="💬 Активные диалоги", callback_data="support_active_dialogs")
    kb.button(text="📊 Статистика", callback_data="support_stats")
    kb.button(text="🔙 Назад", callback_data="admin_back")
    kb.adjust(2, 1, 1)

    await call.message.edit_text(
        f"💬 <b>Управление поддержкой</b>\n\n"
        f"🆕 Новых сообщений: <b>{new_messages}</b>\n"
        f"💬 Активных диалогов: <b>{active_dialogs}</b>\n"
        f"📅 Сообщений сегодня: <b>{total_messages_today}</b>",
        reply_markup=kb.as_markup(),
        parse_mode="HTML"
    )
    await call.answer()


# Просмотр новых сообщений поддержки
@router.callback_query(F.data == "support_new_messages")
async def show_new_support_messages(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    db = get_db()
    try:
        new_messages = db.query(SupportMessage).filter(
            SupportMessage.status == SupportStatus.new,
            SupportMessage.is_from_user == True
        ).order_by(desc(SupportMessage.created_at)).limit(5).all()

        if not new_messages:
            text = "💬 <b>Новые сообщения</b>\n\n✅ Новых сообщений нет"
        else:
            text = "💬 <b>Новые сообщения</b>\n\n"

            for msg in new_messages:
                user_label = f"ID:{msg.user_id}" if msg.user_id else f"Гость:{msg.guest_id[:8]}"
                text += (
                    f"👤 {user_label}\n"
                    f"💬 {msg.message[:100]}...\n"
                    f"🕒 {msg.created_at.strftime('%d.%m %H:%M')}\n\n"
                )

        kb = InlineKeyboardBuilder()
        kb.button(text="🔙 Назад к поддержке", callback_data="admin_support")

        await call.message.edit_text(text, reply_markup=kb.as_markup(), parse_mode="HTML")
    finally:
        db.close()

    await call.answer()


# 📈 Статистика
@router.callback_query(F.data == "admin_stats")
async def admin_stats(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    db = get_db()
    try:
        # Статистика за сегодня
        today = datetime.now().replace(hour=0, minute=0, second=0)

        orders_today = db.query(Order).filter(Order.created_at >= today).count()
        manual_orders_today = db.query(Order).filter(
            Order.created_at >= today,
            Order.payment_method == PaymentMethod.manual
        ).count()

        users_today = db.query(User).filter(User.created_at >= today).count()
        support_messages_today = db.query(SupportMessage).filter(
            SupportMessage.created_at >= today
        ).count()

        # Общая статистика
        total_users = db.query(User).count()
        total_orders = db.query(Order).count()
        pending_manual = db.query(Order).filter(
            Order.payment_method == PaymentMethod.manual,
            Order.status == OrderStatus.pending
        ).count()

    finally:
        db.close()

    text = (
        f"📈 <b>Статистика системы</b>\n\n"
        f"📅 <b>За сегодня:</b>\n"
        f"📦 Заказов: {orders_today}\n"
        f"📋 Ручных заявок: {manual_orders_today}\n"
        f"👥 Новых юзеров: {users_today}\n"
        f"💬 Сообщений: {support_messages_today}\n\n"
        f"📊 <b>Общая статистика:</b>\n"
        f"👥 Всего пользователей: {total_users}\n"
        f"📦 Всего заказов: {total_orders}\n"
        f"⏳ Ожидают обработки: {pending_manual}"
    )

    kb = InlineKeyboardBuilder()
    kb.button(text="🔙 Назад", callback_data="admin_back")

    await call.message.edit_text(text, reply_markup=kb.as_markup(), parse_mode="HTML")
    await call.answer()


# 👥 Управление пользователями
@router.callback_query(F.data == "admin_users")
async def admin_users_menu(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    db = get_db()
    try:
        total_users = db.query(User).count()
        new_users_today = db.query(User).filter(
            User.created_at >= datetime.now().replace(hour=0, minute=0, second=0)
        ).count()

        # Топ пользователей по заказам
        top_users = db.query(User, func.count(Order.id).label('order_count')).join(
            Order, User.id == Order.user_id
        ).group_by(User.id).order_by(desc('order_count')).limit(5).all()

    finally:
        db.close()

    text = (
        f"👥 <b>Управление пользователями</b>\n\n"
        f"📊 Всего пользователей: <b>{total_users}</b>\n"
        f"🆕 Новых сегодня: <b>{new_users_today}</b>\n\n"
        f"🏆 <b>Топ по заказам:</b>\n"
    )

    for user, order_count in top_users:
        username = user.username or user.email or f"ID:{user.id}"
        text += f"• {username}: {order_count} заказов\n"

    kb = InlineKeyboardBuilder()
    kb.button(text="🔍 Поиск пользователя", callback_data="admin_user_search")
    kb.button(text="🔙 Назад", callback_data="admin_back")
    kb.adjust(1)

    await call.message.edit_text(text, reply_markup=kb.as_markup(), parse_mode="HTML")
    await call.answer()


# Кнопка "Назад" к главному меню
@router.callback_query(F.data == "admin_back")
async def admin_back(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    kb = InlineKeyboardBuilder()
    kb.button(text="📋 Ручные заявки", callback_data="admin_manual_orders")
    kb.button(text="💬 Поддержка", callback_data="admin_support")
    kb.button(text="👥 Пользователи", callback_data="admin_users")
    kb.button(text="📈 Статистика", callback_data="admin_stats")
    kb.button(text="🔄 Все заказы", callback_data="admin_all_orders")
    kb.adjust(2, 2, 1)

    await call.message.edit_text(
        "🔧 <b>Панель администратора</b>\n\n"
        "Выберите раздел для управления:",
        reply_markup=kb.as_markup(),
        parse_mode="HTML"
    )
    await call.answer()


# 🔄 Все заказы
@router.callback_query(F.data == "admin_all_orders")
async def admin_all_orders(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    db = get_db()
    try:
        # Получаем последние 10 заказов
        orders = (
            db.query(Order)
            .order_by(desc(Order.created_at))
            .limit(10)
            .all()
        )

        if not orders:
            text = "📦 <b>Все заказы</b>\n\n❌ Заказы не найдены"
        else:
            text = f"📦 <b>Последние {len(orders)} заказов</b>\n\n"

            for order in orders:
                user = db.query(User).get(order.user_id) if order.user_id else None
                username = user.username or user.email or f"ID:{user.id}" if user else "Гость"

                status_emoji = {
                    "pending": "⏳",
                    "paid": "💰",
                    "processing": "⚙️",
                    "done": "✅",
                    "canceled": "❌"
                }.get(order.status.value, "❓")

                game_name = order.manual_game_name or (order.game.name if order.game else "Неизвестно")

                text += (
                    f"{status_emoji} <b>#{order.id}</b> - {game_name}\n"
                    f"👤 {username}\n"
                    f"💰 {order.amount} {order.currency}\n"
                    f"📅 {order.created_at.strftime('%d.%m %H:%M')}\n\n"
                )

    except Exception as e:
        text = f"❌ Ошибка загрузки заказов: {e}"
    finally:
        db.close()

    kb = InlineKeyboardBuilder()
    kb.button(text="🔙 Назад", callback_data="admin_back")

    await call.message.edit_text(text, reply_markup=kb.as_markup(), parse_mode="HTML")
    await call.answer()