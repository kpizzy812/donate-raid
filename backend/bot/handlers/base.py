from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

router = Router()

@router.message(Command("start"))
async def start_handler(message: Message):
    await message.answer("🤖 Бот работает. Вы админ — или просто тестируете?")
