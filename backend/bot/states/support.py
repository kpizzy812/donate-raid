from aiogram.fsm.state import StatesGroup, State

class SupportReplyState(StatesGroup):
    waiting_for_reply = State()
