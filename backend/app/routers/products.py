from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Product
from app.models.game import Game
from app.schemas.product import ProductCreate, ProductRead
from typing import List

router = APIRouter()


@router.get("/", response_model=List[ProductRead])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.post("/", response_model=ProductRead)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == product_data.game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    new_product = Product(**product_data.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/game/{game_id}", response_model=List[ProductRead])
def get_products_for_game(game_id: int, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.game_id == game_id, Product.enabled == True).all()
    return products