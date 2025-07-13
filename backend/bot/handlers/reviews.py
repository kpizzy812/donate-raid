# backend/bot/handlers/reviews.py - ОБРАБОТЧИК МОДЕРАЦИИ ОТЗЫВОВ
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import SessionLocal
from app.models.review import Review
from app.models.order import Order
from app.models.user import User
from bot.config import ADMIN_CHAT_IDS
from datetime import datetime
from loguru import logger

router = Router()


def get_db() -> Session:
    return SessionLocal()


def is_admin(user_id: int) -> bool:
    """Проверка, является ли пользователь админом"""
    return user_id in ADMIN_CHAT_IDS


def review_moderation_keyboard(review_id: int):
    """Клавиатура для модерации отзыва"""
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Одобрить", callback_data=f"review_approve_{review_id}")
    kb.button(text="❌ Отклонить", callback_data=f"review_reject_{review_id}")
    kb.button(text="📝 Подробнее", callback_data=f"review_details_{review_id}")
    kb.button(text="🔙 К отзывам", callback_data="admin_reviews_list")
    kb.adjust(2, 1, 1)
    return kb.as_markup()


def reviews_menu_keyboard():
    """Главное меню отзывов"""
    kb = InlineKeyboardBuilder()
    kb.button(text="🆕 На модерации", callback_data="reviews_pending")
    kb.button(text="✅ Одобренные", callback_data="reviews_approved")
    kb.button(text="📊 Статистика", callback_data="reviews_stats")
    kb.button(text="🔙 В админку", callback_data="admin_back")
    kb.adjust(2, 1, 1)
    return kb.as_markup()


# 🌟 Главное меню отзывов
@router.callback_query(F.data == "admin_reviews")
async def admin_reviews_menu(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    db = get_db()
    try:
        # Получаем статистику
        pending_count = db.query(Review).filter(Review.is_approved == False).count()
        approved_count = db.query(Review).filter(Review.is_approved == True).count()
        total_count = db.query(Review).count()

        stats_text = (
            f"📝 <b>Модерация отзывов</b>\n\n"
            f"🆕 На модерации: <b>{pending_count}</b>\n"
            f"✅ Одобрено: <b>{approved_count}</b>\n"
            f"📊 Всего отзывов: <b>{total_count}</b>"
        )

        await call.message.edit_text(
            stats_text,
            reply_markup=reviews_menu_keyboard(),
            parse_mode="HTML"
        )
    except Exception as e:
        logger.error(f"Ошибка в admin_reviews_menu: {e}")
        await call.answer("❌ Ошибка загрузки", show_alert=True)
    finally:
        db.close()


# 📋 Список отзывов на модерации
@router.callback_query(F.data == "reviews_pending")
async def show_pending_reviews(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    db = get_db()
    try:
        # Получаем отзывы на модерации
        reviews = (
            db.query(Review)
            .options(joinedload(Review.order).joinedload(Order.user))
            .filter(Review.is_approved == False)
            .order_by(desc(Review.created_at))
            .limit(10)
            .all()
        )

        if not reviews:
            await call.message.edit_text(
                "📝 <b>Отзывы на модерации</b>\n\n"
                "✨ Нет отзывов, ожидающих модерации",
                reply_markup=reviews_menu_keyboard(),
                parse_mode="HTML"
            )
            return

        # Отправляем первый отзыв
        await show_review_for_moderation(call, reviews[0], 0, len(reviews))

    except Exception as e:
        logger.error(f"Ошибка в show_pending_reviews: {e}")
        await call.answer("❌ Ошибка загрузки", show_alert=True)
    finally:
        db.close()


async def show_review_for_moderation(call: CallbackQuery, review: Review, index: int, total: int):
    """Показывает отзыв для модерации"""

    # Информация о пользователе
    user_info = "👻 Анонимный пользователь"
    if review.order and review.order.user:
        user = review.order.user
        user_info = f"👤 {user.username or 'Без имени'} (ID: {user.id})"

    # Звездочки рейтинга
    stars = "⭐" * review.rating + "☆" * (5 - review.rating)

    # Форматируем отзыв
    review_text = (
        f"📝 <b>Отзыв на модерации #{review.id}</b>\n"
        f"📄 <b>{index + 1}</b> из <b>{total}</b>\n\n"
        f"🎮 Игра: <b>{review.game_name}</b>\n"
        f"{user_info}\n"
        f"📧 Email: <code>{review.get_masked_email()}</code>\n\n"
        f"⭐ Рейтинг: {stars} ({review.rating}/5)\n\n"
        f"💬 <b>Текст отзыва:</b>\n"
        f"<i>{review.text}</i>\n\n"
        f"🕒 Создан: {review.created_at.strftime('%d.%m.%Y %H:%M')}"
    )

    # Создаем клавиатуру с навигацией
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Одобрить", callback_data=f"review_approve_{review.id}")
    kb.button(text="❌ Отклонить", callback_data=f"review_reject_{review.id}")

    # Кнопки навигации (если есть еще отзывы)
    if total > 1:
        nav_buttons = []
        if index > 0:
            nav_buttons.append(InlineKeyboardBuilder().button(text="⬅️ Пред.", callback_data=f"review_nav_{index - 1}"))
        if index < total - 1:
            nav_buttons.append(InlineKeyboardBuilder().button(text="➡️ След.", callback_data=f"review_nav_{index + 1}"))

        if nav_buttons:
            for btn in nav_buttons:
                kb.button(text=btn.text, callback_data=btn.callback_data)

    kb.button(text="🔙 К меню отзывов", callback_data="admin_reviews")
    kb.adjust(2, 2 if total > 1 else 0, 1)

    await call.message.edit_text(
        review_text,
        reply_markup=kb.as_markup(),
        parse_mode="HTML"
    )


# ✅ Одобрение отзыва
@router.callback_query(F.data.startswith("review_approve_"))
async def approve_review(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    review_id = int(call.data.split("_")[2])
    db = get_db()

    try:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            await call.answer("❌ Отзыв не найден", show_alert=True)
            return

        review.is_approved = True
        db.commit()

        logger.info(f"✅ Отзыв #{review_id} одобрен администратором {call.from_user.id}")

        await call.answer("✅ Отзыв одобрен!", show_alert=True)

        # Возвращаемся к списку отзывов на модерации
        await show_pending_reviews(call)

    except Exception as e:
        logger.error(f"Ошибка при одобрении отзыва {review_id}: {e}")
        await call.answer("❌ Ошибка при одобрении", show_alert=True)
    finally:
        db.close()


# ❌ Отклонение отзыва
@router.callback_query(F.data.startswith("review_reject_"))
async def reject_review(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    review_id = int(call.data.split("_")[2])
    db = get_db()

    try:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            await call.answer("❌ Отзыв не найден", show_alert=True)
            return

        # Удаляем отклоненный отзыв
        db.delete(review)
        db.commit()

        logger.info(f"❌ Отзыв #{review_id} отклонен и удален администратором {call.from_user.id}")

        await call.answer("❌ Отзыв отклонен и удален!", show_alert=True)

        # Возвращаемся к списку отзывов на модерации
        await show_pending_reviews(call)

    except Exception as e:
        logger.error(f"Ошибка при отклонении отзыва {review_id}: {e}")
        await call.answer("❌ Ошибка при отклонении", show_alert=True)
    finally:
        db.close()


# 📊 Статистика отзывов
@router.callback_query(F.data == "reviews_stats")
async def show_reviews_stats(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return await call.answer("❌ Нет прав", show_alert=True)

    db = get_db()
    try:
        # Общая статистика
        total_reviews = db.query(Review).count()
        approved_reviews = db.query(Review).filter(Review.is_approved == True).count()
        pending_reviews = db.query(Review).filter(Review.is_approved == False).count()

        # Статистика по рейтингам (только одобренные)
        from sqlalchemy import func
        rating_stats = (
            db.query(Review.rating, func.count(Review.id))
            .filter(Review.is_approved == True)
            .group_by(Review.rating)
            .all()
        )

        # Средний рейтинг
        avg_rating = (
                db.query(func.avg(Review.rating))
                .filter(Review.is_approved == True)
                .scalar() or 0
        )

        # Формируем текст статистики
        rating_text = ""
        for rating, count in sorted(rating_stats, reverse=True):
            stars = "⭐" * rating
            rating_text += f"{stars}: {count} отзывов\n"

        stats_text = (
            f"📊 <b>Статистика отзывов</b>\n\n"
            f"📝 Всего отзывов: <b>{total_reviews}</b>\n"
            f"✅ Одобрено: <b>{approved_reviews}</b>\n"
            f"🆕 На модерации: <b>{pending_reviews}</b>\n\n"
            f"⭐ Средний рейтинг: <b>{avg_rating:.1f}</b>\n\n"
            f"📈 <b>Распределение по рейтингам:</b>\n"
            f"{rating_text if rating_text else 'Нет одобренных отзывов'}"
        )

        await call.message.edit_text(
            stats_text,
            reply_markup=reviews_menu_keyboard(),
            parse_mode="HTML"
        )

    except Exception as e:
        logger.error(f"Ошибка при получении статистики отзывов: {e}")
        await call.answer("❌ Ошибка загрузки статистики", show_alert=True)
    finally:
        db.close()


# 📝 Команда для быстрого доступа к отзывам
@router.message(F.text == "/reviews")
async def reviews_command(msg: Message):
    if not is_admin(msg.from_user.id):
        return await msg.answer("❌ У вас нет прав администратора")

    await admin_reviews_menu(msg)