# backend/app/routers/games.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОЛЯМИ ВВОДА
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


@router.get("", response_model=List[GameRead])
def list_games(q: str = Query("", alias="q"), db: Session = Depends(get_db)):
    """Получить список всех игр с продуктами, подкатегориями и полями ввода"""
    query = db.query(Game).options(
        joinedload(Game.products),
        joinedload(Game.subcategories),
        joinedload(Game.input_fields)
    ).filter(
        Game.enabled == True,
        Game.is_deleted == False  # ДОБАВЛЕНО: исключаем удаленные игры
    )

    if q:
        query = query.filter(Game.name.ilike(f"%{q}%"))

    games = query.order_by(Game.sort_order.asc()).all()

    logger.info(f"🎮 Возвращаем {len(games)} игр")
    return games


@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db)):
    """Получить конкретную игру с продуктами, подкатегориями и полями ввода"""
    game = db.query(Game).options(
        joinedload(Game.products),
        joinedload(Game.subcategories),
        joinedload(Game.input_fields)
    ).filter(
        Game.id == game_id,
        Game.enabled == True,
        Game.is_deleted == False  # ДОБАВЛЕНО: исключаем удаленные игры
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    logger.info(f"🎮 Возвращаем игру: {game.name}")
    logger.info(f"🎮 Товаров: {len(game.products)}, Подкатегорий: {len(game.subcategories)}")
    logger.info(f"🎮 Полей ввода: {len(game.input_fields)}")
    logger.info(f"🎮 FAQ: {bool(game.faq_content)}, Инструкции: {bool(game.instructions)}")

    return game