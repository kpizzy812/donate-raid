from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.game import Game
from app.schemas.admin.games import GameCreate, GameUpdate, GameRead
from app.services.auth import get_current_user
from app.models.user import User
from app.services.auth import admin_required

router = APIRouter()


@router.get("", response_model=list[GameRead])
def list_games(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    return db.query(Game).order_by(Game.sort_order.asc()).all()

@router.post("", response_model=GameRead)
def create_game(game: GameCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    if db.query(Game).filter(Game.name == game.name).first():
        raise HTTPException(status_code=400, detail="Game already exists")
    new_game = Game(**game.dict())
    db.add(new_game)
    db.commit()
    db.refresh(new_game)
    return new_game

@router.put("/{game_id}", response_model=GameRead)
def update_game(game_id: int, game: GameUpdate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    for field, value in game.dict(exclude_unset=True).items():
        setattr(db_game, field, value)
    db.commit()
    db.refresh(db_game)
    return db_game

@router.delete("/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    db.delete(db_game)
    db.commit()
    return {"detail": "Game deleted"}


@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game
