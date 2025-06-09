import asyncio
from aiogram.types import Message
from bot.config import ADMIN_CHAT_IDS
from .handlers.manual_orders import manual_order_keyboard
from bot.instance import bot

async def send_to_admins(text: str, keyboard=None):
    for chat_id in ADMIN_CHAT_IDS:
        try:
            await bot.send_message(chat_id, text, reply_markup=keyboard)
        except Exception as e:
            print(f"[ERROR] Can't send to {chat_id}: {e}")

def notify_manual_order_sync(text: str, order_id: int = None):
    kb = manual_order_keyboard(order_id) if order_id else None
    asyncio.create_task(send_to_admins(text, kb))
