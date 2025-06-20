from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.game import Game
from app.schemas.admin.games import GameCreate, GameUpdate, GameRead
from app.services.auth import get_current_user
from app.models.user import User
from app.services.auth import admin_required
from loguru import logger

router = APIRouter()


@router.get("", response_model=list[GameRead])
def list_games(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info("🎮 Admin games list called")
    return db.query(Game).order_by(Game.sort_order.asc()).all()


@router.post("", response_model=GameRead)
def create_game(game: GameCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info(f"🎮 Creating game: {game.name} by admin {admin.id}")
    logger.info(f"🎮 Game data: {game.dict()}")

    if db.query(Game).filter(Game.name == game.name).first():
        logger.warning(f"🎮 Game {game.name} already exists")
        raise HTTPException(status_code=400, detail="Game already exists")

    new_game = Game(**game.dict())
    db.add(new_game)
    db.commit()
    db.refresh(new_game)

    logger.info(f"🎮 Game created successfully: {new_game.id}")
    return new_game


@router.put("/{game_id}", response_model=GameRead)
def update_game(game_id: int, game: GameUpdate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info(f"🎮 Updating game {game_id} by admin {admin.id}")
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        logger.warning(f"🎮 Game {game_id} not found for update")
        raise HTTPException(status_code=404, detail="Game not found")
    for field, value in game.dict(exclude_unset=True).items():
        setattr(db_game, field, value)
    db.commit()
    db.refresh(db_game)
    logger.info(f"🎮 Game {game_id} updated successfully")
    return db_game


@router.delete("/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info(f"🎮 Deleting game {game_id} by admin {admin.id}")
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        logger.warning(f"🎮 Game {game_id} not found for deletion")
        raise HTTPException(status_code=404, detail="Game not found")
    db.delete(db_game)
    db.commit()
    logger.info(f"🎮 Game {game_id} deleted successfully")
    return {"detail": "Game deleted"}


@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info(f"🎮 Getting game {game_id}")
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        logger.warning(f"🎮 Game {game_id} not found")
        raise HTTPException(status_code=404, detail="Game not found")
    return game