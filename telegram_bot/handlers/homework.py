from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from services.api_client import BackendClient

router = Router()
client = BackendClient()


@router.message(Command("homework"))
async def homework(message: Message):
    try:
        rows = await client.list_student_homework(message.from_user.id)
    except Exception:
        await message.answer("Unable to fetch homework. Use /register first.")
        return

    if not rows:
        await message.answer("No homework available.")
        return

    top = rows[:5]
    text = "Latest homework:\n" + "\n".join(f"- {item['title']}" for item in top)
    await message.answer(text)
