from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Product
from app.schemas.admin.products import ProductCreate, ProductUpdate, ProductRead
from app.services.auth import get_current_user
from app.models.user import User
from app.services.auth import admin_required

router = APIRouter()

@router.get("", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    return db.query(Product).order_by(Product.sort_order.asc()).all()


@router.post("", response_model=ProductRead)
def create_product(product: ProductCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    new_product = Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in product.dict(exclude_unset=True).items():
        setattr(db_product, field, value)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"detail": "Product deleted"}
