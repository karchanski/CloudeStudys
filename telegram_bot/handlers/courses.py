from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from services.api_client import BackendClient

router = Router()
client = BackendClient()


@router.message(Command("courses"))
async def courses(message: Message):
    try:
        rows = await client.list_student_courses(message.from_user.id)
    except Exception:
        await message.answer("Unable to fetch courses. Use /register first.")
        return

    if not rows:
        await message.answer("No courses found.")
        return

    text = "Your courses:\n" + "\n".join(f"- {item['name']}" for item in rows)
    await message.answer(text)
