from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.game import Game
from app.schemas.game import GameCreate, GameRead
from typing import List
from loguru import logger
from sqlalchemy.orm import joinedload
from fastapi import Query

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[GameRead])
def list_games(q: str = Query("", alias="q"), db: Session = Depends(get_db)):
    query = db.query(Game).options(joinedload(Game.products))
    if q:
        query = query.filter(Game.name.ilike(f"%{q}%"))
    return query.all()

@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).options(joinedload(Game.products)).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game