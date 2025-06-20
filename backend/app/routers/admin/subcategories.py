# backend/app/routers/admin/subcategories.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.game_subcategory import GameSubcategory
from app.models.game import Game
from app.schemas.game_subcategory import GameSubcategoryCreate, GameSubcategoryUpdate, GameSubcategoryRead
from app.services.auth import admin_required
from app.models.user import User
from typing import List
from loguru import logger

router = APIRouter()


@router.get("/game/{game_id}", response_model=List[GameSubcategoryRead])
def get_game_subcategories(
        game_id: int,
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Получить все подкатегории для игры"""
    logger.info(f"🏷️ Получаем подкатегории для игры {game_id}")

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    subcategories = db.query(GameSubcategory).filter(
        GameSubcategory.game_id == game_id
    ).order_by(GameSubcategory.sort_order.asc()).all()

    logger.info(f"🏷️ Найдено {len(subcategories)} подкатегорий")
    return subcategories


@router.post("/game/{game_id}", response_model=GameSubcategoryRead)
def create_subcategory(
        game_id: int,
        subcategory_data: GameSubcategoryCreate,
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Создать новую подкатегорию для игры"""
    logger.info(f"🏷️ Создаем подкатегорию '{subcategory_data.name}' для игры {game_id}")

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Проверяем, что название уникально в рамках игры
    existing = db.query(GameSubcategory).filter(
        GameSubcategory.game_id == game_id,
        GameSubcategory.name == subcategory_data.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Subcategory '{subcategory_data.name}' already exists for this game"
        )

    # Устанавливаем game_id из URL
    subcategory_data.game_id = game_id

    new_subcategory = GameSubcategory(**subcategory_data.dict())
    db.add(new_subcategory)
    db.commit()
    db.refresh(new_subcategory)

    logger.info(f"🏷️ Подкатегория создана с ID: {new_subcategory.id}")
    return new_subcategory


@router.put("/{subcategory_id}", response_model=GameSubcategoryRead)
def update_subcategory(
        subcategory_id: int,
        update_data: GameSubcategoryUpdate,
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Обновить подкатегорию"""
    logger.info(f"🏷️ Обновляем подкатегорию {subcategory_id}")

    subcategory = db.query(GameSubcategory).filter(GameSubcategory.id == subcategory_id).first()
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    # Проверяем уникальность названия при изменении
    if update_data.name and update_data.name != subcategory.name:
        existing = db.query(GameSubcategory).filter(
            GameSubcategory.game_id == subcategory.game_id,
            GameSubcategory.name == update_data.name,
            GameSubcategory.id != subcategory_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Subcategory '{update_data.name}' already exists for this game"
            )

    # Обновляем поля
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(subcategory, field, value)

    db.commit()
    db.refresh(subcategory)

    logger.info(f"🏷️ Подкатегория {subcategory_id} обновлена")
    return subcategory


@router.delete("/{subcategory_id}")
def delete_subcategory(
        subcategory_id: int,
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Удалить подкатегорию"""
    logger.info(f"🏷️ Удаляем подкатегорию {subcategory_id}")

    subcategory = db.query(GameSubcategory).filter(GameSubcategory.id == subcategory_id).first()
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    # Проверяем, что нет товаров в этой подкатегории
    from app.models.product import Product
    products_count = db.query(Product).filter(Product.subcategory_id == subcategory_id).count()

    if products_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete subcategory: {products_count} products are still using it"
        )

    db.delete(subcategory)
    db.commit()

    logger.info(f"🏷️ Подкатегория {subcategory_id} удалена")
    return {"detail": "Subcategory deleted successfully"}


@router.get("", response_model=List[GameSubcategoryRead])
def list_all_subcategories(
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Получить все подкатегории всех игр"""
    logger.info("🏷️ Получаем все подкатегории")

    subcategories = db.query(GameSubcategory).order_by(
        GameSubcategory.game_id.asc(),
        GameSubcategory.sort_order.asc()
    ).all()

    return subcategories