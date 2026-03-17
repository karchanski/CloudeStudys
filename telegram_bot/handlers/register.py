from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message

from services.api_client import BackendClient

router = Router()
client = BackendClient()


class RegisterStates(StatesGroup):
    waiting_link_code = State()


@router.message(Command("register"))
async def register_start(message: Message, state: FSMContext):
    await state.set_state(RegisterStates.waiting_link_code)
    await message.answer("Enter your one-time link code from the web profile:")


@router.message(RegisterStates.waiting_link_code, F.text)
async def register_finish(message: Message, state: FSMContext):
    code = (message.text or "").strip().upper()
    if len(code) < 4:
        await message.answer("Link code looks too short. Try again.")
        return

    try:
        result = await client.link_telegram(code, message.from_user.id)
        await message.answer(f"Registration completed: {result.get('status', 'ok')}")
    except Exception:
        await message.answer("Unable to link account. Check the code and try again.")
    finally:
        await state.clear()
