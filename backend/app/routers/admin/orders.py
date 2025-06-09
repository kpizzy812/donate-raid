from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from decimal import Decimal
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.schemas.admin.orders import OrderRead, OrderUpdate
from app.services.auth import get_current_user
from app.models.user import User
from app.services.mailer import send_email, render_template
from app.services.auth import admin_required

router = APIRouter()


@router.get("/", response_model=list[OrderRead])
def list_orders(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).all()


@router.put("/{order_id}", response_model=OrderRead)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    for field, value in order_update.dict(exclude_unset=True).items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)

    user = db.query(User).filter(User.id == order.user_id).first()
    if order.status == "completed" and user and user.email:
        html = render_template("order_success.html", {
            "order_id": order.id,
            "amount": order.amount,
            "currency": order.currency,
            "username": user.username,
        })
        send_email(
            to=user.email,
            subject="✅ Заказ выполнен | Donate Raid",
            body=html
        )

    return order


@router.post("/{order_id}/refund")
def refund_order(
    order_id: int,
    refund_amount: float = Body(..., embed=True),
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required),
):
    """
    Админ-эндпоинт для возврата средств по заказу.
    - order_id: ид заказа в path
    - refund_amount: сумма возврата, приходит в JSON-body: { "refund_amount": 100.0 }
    - проверяем, что заказ существует и status == OrderStatus.pending
    - проверяем, что refund_amount <= order.amount
    - возвращаем баланс пользователю и помечаем заказ canceled
    - шлём письмо
    - возвращаем JSON с деталями возврата
    """

    print(f"▶▶▶ Вызван refund_order: order_id={order_id}, refund_amount={refund_amount}, admin_id={admin.id}")

    # 1) Найдём сам заказ
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        print(f"    → Заказ с id={order_id} не найден")
        raise HTTPException(status_code=404, detail="Order not found")

    # 2) Логируем текущее состояние заказа
    print(f"    → Текущий статус заказа id={order.id}: {order.status} (enum), сумма заказа={order.amount}")

    # 3) Проверяем статус при помощи Enum, а не строки
    if order.status != OrderStatus.pending:
        print(f"    → Статус заказа id={order.id} = {order.status}, возврат НЕ разрешён (только для pending)")
        raise HTTPException(status_code=400, detail="Refund allowed only for pending orders")

    # 4) Проверяем, что сумма возврата не больше суммы заказа
    if refund_amount > float(order.amount):
        print(f"    → Запрошенный возврат {refund_amount} > сумма заказа {order.amount}")
        raise HTTPException(status_code=400, detail="Refund exceeds order amount")

    # 5) Находим пользователя, которому принадлежит заказ
    user = db.query(User).filter(User.id == order.user_id).first()
    if not user:
        print(f"    → Пользователь с id={order.user_id} не найден")
        raise HTTPException(status_code=404, detail="User not found")

    # 6) Делаем возврат: увеличиваем баланс и меняем статус заказа
    old_balance = user.balance or Decimal("0")
    new_balance = old_balance + Decimal(str(refund_amount))
    user.balance = new_balance
    order.status = OrderStatus.canceled
    db.commit()

    print(f"    → Баланс user_id={user.id} был {old_balance}, стал {new_balance}")
    print(f"    → Заказ id={order.id} переведён в статус {order.status}")

    # 7) Отправляем письмо, если у пользователя есть email
    if user.email:
        html = render_template("order_refund.html", {
            "order_id": order.id,
            "refund_amount": refund_amount,
            "currency": order.currency,
            "username": user.username,
        })
        send_email(
            to=user.email,
            subject="💸 Возврат средств | Donate Raid",
            body=html
        )
        print(f"    → Отправлено письмо о возврате пользователю {user.email}")

    # 8) Возвращаем ответ
    return {
        "status": "refunded",
        "refunded_amount": float(refund_amount),
        "order_id": order.id,
        "user_id": user.id,
        "currency": order.currency
    }