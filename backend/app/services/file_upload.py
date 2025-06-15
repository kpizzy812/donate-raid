# backend/app/services/file_upload.py - ДОПОЛНЕННАЯ ВЕРСИЯ
import os
import uuid
import base64
import io
from typing import Optional
from fastapi import UploadFile, HTTPException
from PIL import Image
import aiofiles

UPLOAD_DIR = "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class FileUploadService:
    @staticmethod
    async def save_image(file: UploadFile, subfolder: str = "images") -> str:
        """
        Сохраняет изображение и возвращает путь к файлу

        Args:
            file: Загружаемый файл
            subfolder: Подпапка для сохранения (images, blog, games, etc.)

        Returns:
            Путь к сохраненному файлу относительно UPLOAD_DIR
        """

        # Проверяем тип файла
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )

        # Проверяем размер файла
        file_size = 0
        content = await file.read()
        file_size = len(content)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024 * 1024)}MB"
            )

        # Генерируем уникальное имя файла
        file_extension = file.filename.split('.')[-1].lower() if file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"

        # Создаем путь для сохранения
        save_dir = os.path.join(UPLOAD_DIR, subfolder)
        os.makedirs(save_dir, exist_ok=True)

        file_path = os.path.join(save_dir, unique_filename)

        # Сохраняем файл
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        # Возвращаем относительный путь
        return os.path.join(subfolder, unique_filename).replace('\\', '/')

    @staticmethod
    def save_base64_image(base64_data: str, subfolder: str = "images") -> str:
        """
        ИСПРАВЛЕНО: Синхронное сохранение base64 изображения

        Args:
            base64_data: Base64 строка с изображением (с префиксом data:image/...)
            subfolder: Подпапка для сохранения

        Returns:
            Путь к сохраненному файлу относительно UPLOAD_DIR
        """
        try:
            # Парсим base64 данные
            if not base64_data.startswith('data:image/'):
                raise ValueError("Неверный формат base64 изображения")

            # Извлекаем тип и данные
            header, encoded = base64_data.split(',', 1)
            mime_type = header.split(';')[0].split(':')[1]

            # Проверяем тип изображения
            if mime_type not in ALLOWED_IMAGE_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Неподдерживаемый тип файла: {mime_type}"
                )

            # Декодируем base64
            image_data = base64.b64decode(encoded)

            # Проверяем размер
            if len(image_data) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024 * 1024)}MB"
                )

            # Определяем расширение файла
            extension_map = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif',
                'image/webp': 'webp'
            }
            file_extension = extension_map.get(mime_type, 'jpg')

            # Генерируем уникальное имя файла
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"

            # Создаем путь для сохранения
            save_dir = os.path.join(UPLOAD_DIR, subfolder)
            os.makedirs(save_dir, exist_ok=True)

            file_path = os.path.join(save_dir, unique_filename)

            # Сохраняем файл
            with open(file_path, 'wb') as f:
                f.write(image_data)

            # Возвращаем относительный путь
            return os.path.join(subfolder, unique_filename).replace('\\', '/')

        except Exception as e:
            print(f"Ошибка сохранения base64 изображения: {e}")
            raise HTTPException(status_code=400, detail=f"Ошибка обработки изображения: {str(e)}")

    @staticmethod
    def get_file_url(file_path: str) -> str:
        """
        ИСПРАВЛЕНО: Получает полный URL файла

        Args:
            file_path: Относительный путь к файлу

        Returns:
            Полный URL файла
        """
        # Убираем ведущий слеш если есть
        clean_path = file_path.lstrip('/')

        # Возвращаем путь с /uploads/ префиксом
        return f"/uploads/{clean_path}"

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Удаляет файл

        Args:
            file_path: Путь к файлу относительно UPLOAD_DIR

        Returns:
            True если файл удален успешно
        """
        try:
            full_path = os.path.join(UPLOAD_DIR, file_path)
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
            return False
        except Exception as e:
            print(f"Ошибка удаления файла {file_path}: {e}")
            return False

    @staticmethod
    def optimize_image(file_path: str, max_width: int = 1920, max_height: int = 1080, quality: int = 85) -> bool:
        """
        Оптимизирует изображение (сжимает и изменяет размер при необходимости)

        Args:
            file_path: Путь к файлу
            max_width: Максимальная ширина
            max_height: Максимальная высота
            quality: Качество сжатия (1-100)

        Returns:
            True если оптимизация прошла успешно
        """
        try:
            full_path = os.path.join(UPLOAD_DIR, file_path)

            with Image.open(full_path) as img:
                # Конвертируем в RGB если нужно
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')

                # Изменяем размер если изображение слишком большое
                if img.width > max_width or img.height > max_height:
                    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

                # Сохраняем с оптимизацией
                img.save(full_path, format='JPEG', quality=quality, optimize=True)

            return True
        except Exception as e:
            print(f"Ошибка оптимизации изображения {file_path}: {e}")
            return False