import asyncio
import os

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv

from handlers.courses import router as courses_router
from handlers.homework import router as homework_router
from handlers.register import router as register_router
from handlers.start import router as start_router

load_dotenv()


def build_dispatcher() -> Dispatcher:
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(start_router)
    dp.include_router(register_router)
    dp.include_router(courses_router)
    dp.include_router(homework_router)
    return dp


async def main() -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is missing")

    bot = Bot(token=token)
    dp = build_dispatcher()
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
