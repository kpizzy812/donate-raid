from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.users import UserOut
from app.models.user import User
from app.services.auth import get_current_user
from decimal import Decimal
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/balance")
def get_balance(current_user: User = Depends(get_current_user)):
    return {"balance": float(current_user.balance or Decimal("0.0"))}