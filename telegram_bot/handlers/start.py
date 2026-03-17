from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

router = Router()


@router.message(Command("start"))
async def start(message: Message):
    await message.answer(
        "SMART EDU JOURNAL bot\n\n"
        "Commands:\n"
        "/register - link your student account with a one-time code\n"
        "/courses - show your courses\n"
        "/homework - show latest homework"
    )
