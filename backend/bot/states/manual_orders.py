from aiogram.fsm.state import StatesGroup, State

class ApproveOrderState(StatesGroup):
    amount = State()

class RefundOrderState(StatesGroup):
    amount = State()
