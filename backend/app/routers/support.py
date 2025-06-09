from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.support import SupportMessage, SupportStatus
from app.services.auth import get_current_user, get_current_user_from_request
from app.schemas.support import SupportMessageCreate, SupportMessageRead
from bot.handlers.support import notify_new_support_message
from app.models.user import User
from datetime import datetime
from typing import Optional

router = APIRouter()


@router.post("/message", response_model=SupportMessageRead)
async def create_support_message(
    data: SupportMessageCreate,
    request: Request,
    guest_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    user = None
    try:
        user = await get_current_user(request)
    except Exception:
        pass

    message = SupportMessage(
        user_id=user.id if user else None,
        guest_id=guest_id if not user else None,
        message=data.message,
        is_from_user=True,
        status=SupportStatus.new,
        created_at=datetime.utcnow()
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await notify_new_support_message(
        user_id=user.id if user else None,
        text=data.message,
        guest_id=guest_id if not user else None
    )
    return message


@router.get("/my", response_model=list[SupportMessageRead])
def get_my_support_history(
    request: Request,
    db: Session = Depends(get_db),
    guest_id: Optional[str] = Query(None),
):
    try:
        current_user = get_current_user_from_request(request, db)
        return (
            db.query(SupportMessage)
            .filter_by(user_id=current_user.id)
            .order_by(SupportMessage.created_at.asc())
            .all()
        )
    except Exception:
        if guest_id:
            return (
                db.query(SupportMessage)
                .filter_by(guest_id=guest_id)
                .order_by(SupportMessage.created_at.asc())
                .all()
            )
        return []
