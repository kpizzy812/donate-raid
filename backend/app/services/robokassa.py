# backend/app/services/robokassa.py
import hashlib
import os
from typing import Optional, Dict, Any
from decimal import Decimal
import requests
from loguru import logger


class RoboKassaService:
    """Сервис для работы с RoboKassa API"""

    def __init__(self):
        # Тестовые настройки для демо-режима
        self.merchant_login = os.getenv("ROBOKASSA_MERCHANT_LOGIN", "demo")
        self.password1 = os.getenv("ROBOKASSA_PASSWORD_1", "password_1")
        self.password2 = os.getenv("ROBOKASSA_PASSWORD_2", "password_2")
        self.is_test = os.getenv("ROBOKASSA_IS_TEST", "true").lower() == "true"

        # URL'ы для разных режимов
        if self.is_test:
            self.payment_url = "https://auth.robokassa.ru/Merchant/Index.aspx"
        else:
            self.payment_url = "https://auth.robokassa.ru/Merchant/Index.aspx"

    def generate_signature(self, merchant_login: str, out_sum: str, inv_id: str,
                           password: str, receipt: Optional[str] = None) -> str:
        """Генерация подписи для RoboKassa"""
        if receipt:
            # С чеком: MerchantLogin:OutSum:InvId:Receipt:Password
            signature_string = f"{merchant_login}:{out_sum}:{inv_id}:{receipt}:{password}"
        else:
            # Без чека: MerchantLogin:OutSum:InvId:Password
            signature_string = f"{merchant_login}:{out_sum}:{inv_id}:{password}"

        logger.info(f"🔑 Строка для подписи: {signature_string}")
        signature = hashlib.md5(signature_string.encode('utf-8')).hexdigest()
        logger.info(f"🔑 Подпись: {signature}")
        return signature

    def create_payment_url(self, order_id: int, amount: Decimal, currency: str = "RUB",
                           description: str = None, receipt: Optional[str] = None) -> str:
        """Создание URL для оплаты через RoboKassa"""

        out_sum = str(amount)
        inv_id = str(order_id)
        desc = description or f"Оплата заказа №{order_id} на Donate Raid"

        # Генерируем подпись
        signature = self.generate_signature(
            self.merchant_login, out_sum, inv_id, self.password1, receipt
        )

        # Формируем параметры для URL
        params = {
            "MerchantLogin": self.merchant_login,
            "OutSum": out_sum,
            "InvId": inv_id,
            "Description": desc,
            "SignatureValue": signature,
            "Culture": "ru",  # Русский интерфейс
        }

        # Добавляем тестовый режим
        if self.is_test:
            params["IsTest"] = "1"

        # Добавляем чек если есть
        if receipt:
            params["Receipt"] = receipt

        # Success/Fail URL'ы
        params["SuccessURL"] = f"https://donateraid.ru/order/{order_id}"
        params["FailURL"] = f"https://donateraid.ru/order/{order_id}"

        # Формируем финальный URL
        query_string = "&".join([f"{key}={requests.utils.quote(str(value))}" for key, value in params.items()])
        payment_url = f"{self.payment_url}?{query_string}"

        logger.info(f"💳 Создан URL для оплаты заказа #{order_id}: {payment_url}")
        return payment_url

    def verify_signature_result(self, out_sum: str, inv_id: str, signature_value: str,
                                receipt: Optional[str] = None) -> bool:
        """Проверка подписи от RoboKassa (Result URL)"""

        # Для Result URL подпись: OutSum:InvId:Password#2 (без MerchantLogin!)
        if receipt:
            signature_string = f"{out_sum}:{inv_id}:{receipt}:{self.password2}"
        else:
            signature_string = f"{out_sum}:{inv_id}:{self.password2}"

        logger.info(f"🔍 Строка для проверки подписи Result: {signature_string}")
        expected_signature = hashlib.md5(signature_string.encode('utf-8')).hexdigest()

        is_valid = signature_value.lower() == expected_signature.lower()
        logger.info(f"🔍 Проверка подписи Result: {'✅ ОК' if is_valid else '❌ ОШИБКА'}")
        logger.info(f"    Получена: {signature_value}")
        logger.info(f"    Ожидается: {expected_signature}")

        return is_valid

    def get_payment_methods(self) -> Dict[str, Any]:
        """Получение доступных способов оплаты для конкретных методов"""
        return {
            "sberbank": {
                "name": "Банковские карты",
                "description": "Visa, MasterCard, МИР",
                "icon": "credit-card",
                "type": "card"
            },
            "sbp": {
                "name": "СБП",
                "description": "Система быстрых платежей",
                "icon": "smartphone",
                "type": "sbp"
            }
        }


# Глобальный экземпляр сервиса
robokassa_service = RoboKassaService()