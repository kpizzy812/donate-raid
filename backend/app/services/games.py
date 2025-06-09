from sqlalchemy.orm import Session
from app.models.game import Game


def get_all_games(db: Session, query: str = ""):
    q = db.query(Game)
    if query:
        q = q.filter(Game.name.ilike(f"%{query}%"))
    return q.all()


def get_game_by_id(db: Session, game_id: int):
    return db.query(Game).filter(Game.id == game_id).first()
