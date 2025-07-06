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
    return db.query(Product).filter(Product.is_deleted == False).order_by(Product.sort_order.asc()).all()


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_product = db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Мягкое удаление
    db_product.is_deleted = True
    db.commit()
    return {"detail": "Product deleted"}


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    """Получить продукт по ID для редактирования в админке"""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_deleted == False
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product

@router.post("", response_model=ProductRead)
def create_product(product: ProductCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    # ИСПРАВЛЕНО: используем model_dump() вместо dict() для Pydantic v2
    new_product = Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db),
                   admin: User = Depends(admin_required)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ИСПРАВЛЕНО: используем model_dump() вместо dict() для Pydantic v2
    for field, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Проверяем, что нет заказов с этим товаром
    from app.models.order import Order
    orders_count = db.query(Order).filter(Order.product_id == product_id).count()

    if orders_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete product: {orders_count} orders are still using it"
        )

    db.delete(db_product)
    db.commit()
    return {"detail": "Product deleted"}