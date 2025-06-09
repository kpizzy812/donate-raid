import asyncio
from aiogram import Dispatcher
from bot.handlers import router as main_router
from bot.instance import bot

dp = Dispatcher()
dp.include_router(main_router)

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
