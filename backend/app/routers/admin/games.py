# backend/app/routers/admin/games.py - ОБНОВЛЕННАЯ ВЕРСИЯ

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.game import Game
from app.models.game_input_field import GameInputField  # ДОБАВЛЕНО
from app.schemas.admin.games import GameCreate, GameUpdate, GameRead
from app.services.auth import get_current_user
from app.models.user import User
from app.services.auth import admin_required
from loguru import logger

router = APIRouter()


@router.get("", response_model=list[GameRead])
def list_games(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info("🎮 Admin games list called")
    return db.query(Game).filter(Game.is_deleted == False).order_by(Game.sort_order.asc()).all()


@router.post("", response_model=GameRead)
def create_game(game: GameCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info(f"🎮 Creating game: {game.name} by admin {admin.id}")
    logger.info(f"🎮 Game data: {game.dict()}")

    if db.query(Game).filter(Game.name == game.name).first():
        logger.warning(f"🎮 Game {game.name} already exists")
        raise HTTPException(status_code=400, detail="Game already exists")

    # ОБНОВЛЕНО: Создаем игру без input_fields
    game_data = game.dict()
    input_fields_data = game_data.pop('input_fields', [])  # Извлекаем поля ввода

    new_game = Game(**game_data)
    db.add(new_game)
    db.commit()
    db.refresh(new_game)

    # ДОБАВЛЕНО: Создаем поля ввода отдельно
    if input_fields_data:
        logger.info(f"🎮 Creating {len(input_fields_data)} input fields for game {new_game.id}")

        for idx, field_data in enumerate(input_fields_data):
            # Пропускаем поля без названия
            if not field_data.get('name') or not field_data.get('label'):
                logger.warning(f"🎮 Skipping field {idx}: missing name or label")
                continue

            # ВАЖНО: Обрабатываем subcategory_id
            subcategory_id = field_data.get('subcategory_id')
            if subcategory_id == 0:  # Если выбрано "Для всех подкатегорий"
                subcategory_id = None

            input_field = GameInputField(
                game_id=new_game.id,
                name=field_data['name'],
                label=field_data['label'],
                field_type=field_data.get('type', 'text'),
                required=field_data.get('required', True),
                placeholder=field_data.get('placeholder'),
                help_text=field_data.get('help_text'),
                options=field_data.get('options'),  # JSON поле
                min_length=field_data.get('min_length'),
                max_length=field_data.get('max_length'),
                validation_regex=field_data.get('validation_regex'),
                sort_order=idx,
                subcategory_id=subcategory_id,  # КЛЮЧЕВОЕ ПОЛЕ!
                enabled=True
            )

            db.add(input_field)
            logger.info(f"🎮 Added input field: {field_data['label']} (subcategory: {subcategory_id})")

        db.commit()

    logger.info(f"🎮 Game created successfully: {new_game.id}")
    return new_game


@router.put("/{game_id}", response_model=GameRead)
def update_game(game_id: int, game: GameUpdate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info(f"🎮 Updating game {game_id} by admin {admin.id}")

    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        logger.warning(f"🎮 Game {game_id} not found for update")
        raise HTTPException(status_code=404, detail="Game not found")

    # ОБНОВЛЕНО: Обрабатываем input_fields отдельно
    game_data = game.dict(exclude_unset=True)
    input_fields_data = game_data.pop('input_fields', None)

    # Обновляем основные поля игры
    for field, value in game_data.items():
        setattr(db_game, field, value)

    # ДОБАВЛЕНО: Обновляем поля ввода
    if input_fields_data is not None:
        logger.info(f"🎮 Updating input fields for game {game_id}")

        # Удаляем все старые поля
        db.query(GameInputField).filter(GameInputField.game_id == game_id).delete()

        # Создаем новые поля
        for idx, field_data in enumerate(input_fields_data):
            if not field_data.get('name') or not field_data.get('label'):
                continue

            subcategory_id = field_data.get('subcategory_id')
            if subcategory_id == 0:
                subcategory_id = None

            input_field = GameInputField(
                game_id=game_id,
                name=field_data['name'],
                label=field_data['label'],
                field_type=field_data.get('type', 'text'),
                required=field_data.get('required', True),
                placeholder=field_data.get('placeholder'),
                help_text=field_data.get('help_text'),
                options=field_data.get('options'),
                min_length=field_data.get('min_length'),
                max_length=field_data.get('max_length'),
                validation_regex=field_data.get('validation_regex'),
                sort_order=idx,
                subcategory_id=subcategory_id,
                enabled=True
            )

            db.add(input_field)

    db.commit()
    db.refresh(db_game)
    logger.info(f"🎮 Game {game_id} updated successfully")
    return db_game


@router.delete("/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info(f"🎮 Deleting game {game_id} by admin {admin.id}")
    db_game = db.query(Game).filter(Game.id == game_id, Game.is_deleted == False).first()
    if not db_game:
        logger.warning(f"🎮 Game {game_id} not found for deletion")
        raise HTTPException(status_code=404, detail="Game not found")

    # Мягкое удаление
    db_game.is_deleted = True
    db.commit()
    logger.info(f"🎮 Game {game_id} soft deleted successfully")
    return {"detail": "Game deleted"}


@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    logger.info(f"🎮 Getting game {game_id}")
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        logger.warning(f"🎮 Game {game_id} not found")
        raise HTTPException(status_code=404, detail="Game not found")
    return game