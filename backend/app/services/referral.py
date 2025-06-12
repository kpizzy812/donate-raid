# backend/app/services/referral.py - НОВЫЙ ФАЙЛ
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.referral import ReferralEarning
from app.models.order import Order
from app.core.config import settings
from decimal import Decimal
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class ReferralService:
    @staticmethod
    def get_referral_percentage() -> Decimal:
        """Получает процент реферальных выплат из .env"""
        try:
            # Проверяем наличие переменной в settings
            percentage = getattr(settings, 'REFERRAL_PERCENTAGE', '5.0')
            return Decimal(str(percentage))
        except (ValueError, AttributeError):
            logger.warning("REFERRAL_PERCENTAGE не найден в .env, используем 5% по умолчанию")
            return Decimal("5.0")

    @staticmethod
    def process_referral_earning(db: Session, order: Order) -> Optional[ReferralEarning]:
        """
        Обрабатывает реферальную выплату при оплаченном заказе

        Args:
            db: Сессия базы данных
            order: Заказ, по которому нужно сделать выплату

        Returns:
            ReferralEarning объект если выплата была произведена, иначе None
        """
        if not order.user_id:
            logger.info(f"Заказ {order.id} не имеет user_id, пропускаем реферальную выплату")
            return None

        # Получаем пользователя, который сделал заказ
        user = db.query(User).filter_by(id=order.user_id).first()
        if not user or not user.referred_by_id:
            logger.info(f"Пользователь {order.user_id} не был приглашен по реферальной ссылке")
            return None

        # Получаем реферера
        referrer = db.query(User).filter_by(id=user.referred_by_id).first()
        if not referrer:
            logger.error(f"Не найден реферер с ID {user.referred_by_id}")
            return None

        # Проверяем, не была ли уже выплачена награда за этот заказ
        existing_earning = db.query(ReferralEarning).filter_by(order_id=order.id).first()
        if existing_earning:
            logger.info(f"Реферальная выплата за заказ {order.id} уже была произведена")
            return existing_earning

        # Рассчитываем размер выплаты
        percentage = ReferralService.get_referral_percentage()
        referral_amount = (order.amount * percentage) / Decimal("100")

        logger.info(
            f"Обрабатываем реферальную выплату: заказ {order.id}, сумма {order.amount}, процент {percentage}%, выплата {referral_amount}")

        # Создаем запись о выплате
        earning = ReferralEarning(
            referrer_id=referrer.id,
            referred_user_id=user.id,
            order_id=order.id,
            amount=referral_amount,
            percentage=percentage
        )

        # Зачисляем реферальную выплату на баланс реферера
        referrer.balance += referral_amount
        referrer.referral_earnings += referral_amount

        # Сохраняем изменения
        db.add(earning)
        db.commit()
        db.refresh(earning)

        logger.info(
            f"Реферальная выплата {referral_amount} зачислена пользователю {referrer.id} (код: {referrer.referral_code})")

        return earning

    @staticmethod
    def get_user_by_referral_code(db: Session, referral_code: str) -> Optional[User]:
        """Находит пользователя по реферальному коду"""
        return db.query(User).filter_by(referral_code=referral_code).first()

    @staticmethod
    def register_referral(db: Session, new_user: User, referral_code: str) -> bool:
        """
        Регистрирует нового пользователя как реферала

        Args:
            db: Сессия базы данных
            new_user: Новый пользователь
            referral_code: Реферальный код пригласившего

        Returns:
            True если реферал был зарегистрирован, False если код не найден
        """
        referrer = ReferralService.get_user_by_referral_code(db, referral_code)
        if not referrer:
            logger.warning(f"Реферальный код {referral_code} не найден")
            return False

        if referrer.id == new_user.id:
            logger.warning(f"Пользователь {new_user.id} пытается использовать свой собственный реферальный код")
            return False

        # Устанавливаем связь
        new_user.referred_by_id = referrer.id

        # Увеличиваем счетчик рефералов у пригласившего
        referrer.total_referrals += 1

        db.commit()

        logger.info(f"Пользователь {new_user.id} зарегистрирован как реферал пользователя {referrer.id}")
        return True

    @staticmethod
    def generate_referral_link(user: User, base_url: str = "https://donate-raid.com") -> str:
        """Генерирует реферальную ссылку для пользователя"""
        if not user.referral_code:
            user.generate_referral_code()

        return f"{base_url}/register?ref={user.referral_code}"