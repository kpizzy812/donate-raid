# backend/app/services/file_upload.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
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

        # Создаем директорию если не существует
        upload_path = os.path.join(UPLOAD_DIR, subfolder)
        os.makedirs(upload_path, exist_ok=True)

        # Полный путь к файлу
        file_path = os.path.join(upload_path, unique_filename)

        # Сохраняем файл
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        # Оптимизируем изображение
        try:
            await FileUploadService._optimize_image(file_path)
        except Exception as e:
            print(f"Ошибка оптимизации изображения: {e}")

        # Возвращаем относительный путь
        return os.path.join(subfolder, unique_filename).replace('\\', '/')

    @staticmethod
    def save_base64_image(base64_data: str, subfolder: str = "blog") -> str:
        """
        Конвертирует base64 изображение в файл и сохраняет его

        Args:
            base64_data: Base64 строка с изображением (data:image/jpeg;base64,...)
            subfolder: Подпапка для сохранения

        Returns:
            Путь к сохраненному файлу относительно UPLOAD_DIR
        """
        try:
            # Парсим base64 данные
            if not base64_data.startswith('data:image/'):
                raise ValueError("Неверный формат base64 изображения")

            # Извлекаем тип изображения и данные
            header, encoded = base64_data.split(',', 1)
            image_type = header.split('/')[1].split(';')[0].lower()

            # Проверяем поддерживаемые форматы
            allowed_types = ['jpeg', 'jpg', 'png', 'gif', 'webp']
            if image_type not in allowed_types:
                raise ValueError(f"Неподдерживаемый тип изображения: {image_type}")

            # Декодируем base64
            image_data = base64.b64decode(encoded)

            # Проверяем размер
            if len(image_data) > MAX_FILE_SIZE:
                raise ValueError(f"Файл слишком большой: {len(image_data)} байт")

            # Генерируем уникальное имя файла
            file_extension = 'jpg' if image_type == 'jpeg' else image_type
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"

            # Создаем директорию если не существует
            upload_path = os.path.join(UPLOAD_DIR, subfolder)
            os.makedirs(upload_path, exist_ok=True)

            # Полный путь к файлу
            file_path = os.path.join(upload_path, unique_filename)

            # Оптимизируем и сохраняем изображение
            with Image.open(io.BytesIO(image_data)) as img:
                # Конвертируем в RGB если нужно
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')

                # Изменяем размер если изображение слишком большое
                max_width = 1920
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

                # Сохраняем с оптимизацией
                img.save(file_path, 'JPEG', quality=85, optimize=True)

            # Возвращаем относительный путь
            return os.path.join(subfolder, unique_filename).replace('\\', '/')

        except Exception as e:
            raise ValueError(f"Ошибка обработки base64 изображения: {str(e)}")

    @staticmethod
    async def _optimize_image(file_path: str, max_width: int = 1920, quality: int = 85):
        """Оптимизирует изображение: сжимает и изменяет размер если нужно"""
        try:
            with Image.open(file_path) as img:
                # Конвертируем в RGB если нужно
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')

                # Изменяем размер если изображение слишком большое
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

                # Сохраняем с оптимизацией
                img.save(file_path, 'JPEG', quality=quality, optimize=True)

        except Exception as e:
            print(f"Ошибка при оптимизации изображения {file_path}: {e}")

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Удаляет файл"""
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
    def get_file_url(file_path: str, base_url: str = "") -> str:
        """Генерирует URL для доступа к файлу"""
        if not file_path:
            return ""

        # Убираем слеши в начале и нормализуем путь
        normalized_path = file_path.lstrip('/').replace('\\', '/')

        if base_url:
            base_url = base_url.rstrip('/')
            return f"{base_url}/uploads/{normalized_path}"

        return f"/uploads/{normalized_path}"