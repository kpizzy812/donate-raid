# backend/app/routers/upload.py - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth import get_current_user, admin_required
from app.models.user import User
from app.services.file_upload import FileUploadService
import os

router = APIRouter()


@router.post("/image")
async def upload_image(
        file: UploadFile = File(...),
        subfolder: str = "images",
        current_user: User = Depends(get_current_user)
):
    """Загрузка изображения (доступно авторизованным пользователям)"""

    print(f"🔍 Начало загрузки файла: {file.filename}, размер: {file.size if hasattr(file, 'size') else 'неизвестно'}")
    print(f"🔍 Пользователь: {current_user.id}, подпапка: {subfolder}")

    # Ограничиваем подпапки для безопасности
    allowed_subfolders = ["images", "blog", "games", "products", "avatars"]
    if subfolder not in allowed_subfolders:
        print(f"❌ Недопустимая подпапка: {subfolder}")
        raise HTTPException(status_code=400, detail="Недопустимая подпапка")

    try:
        print(f"🔄 Сохраняем файл в подпапку: {subfolder}")
        file_path = await FileUploadService.save_image(file, subfolder)
        print(f"✅ Файл сохранен: {file_path}")

        # ИСПРАВЛЕНО: используем правильный метод с одним параметром
        file_url = FileUploadService.get_file_url(file_path)
        print(f"✅ URL файла: {file_url}")

        return {
            "success": True,
            "file_path": file_path,
            "file_url": file_url,
            "message": "Файл успешно загружен"
        }

    except Exception as e:
        print(f"❌ Ошибка загрузки файла: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")


@router.post("/admin/image")
async def admin_upload_image(
        file: UploadFile = File(...),
        subfolder: str = "admin",
        admin: User = Depends(admin_required)
):
    """Загрузка изображения для администраторов (расширенные права)"""

    # Для админов разрешаем больше подпапок
    allowed_subfolders = ["images", "blog", "games", "products", "avatars", "admin", "temp"]
    if subfolder not in allowed_subfolders:
        raise HTTPException(status_code=400, detail="Недопустимая подпапка")

    try:
        file_path = await FileUploadService.save_image(file, subfolder)
        # ИСПРАВЛЕНО: используем правильный метод с одним параметром
        file_url = FileUploadService.get_file_url(file_path)

        return {
            "success": True,
            "file_path": file_path,
            "file_url": file_url,
            "original_name": file.filename,
            "message": "Файл успешно загружен администратором"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")


@router.delete("/file/{file_path:path}")
async def delete_file(
        file_path: str,
        admin: User = Depends(admin_required)
):
    """Удаление файла (только для администраторов)"""

    success = FileUploadService.delete_file(file_path)
    if not success:
        raise HTTPException(status_code=404, detail="Файл не найден или не может быть удален")

    return {"success": True, "message": "Файл успешно удален"}


@router.get("/test")
async def test_upload_system(current_user: User = Depends(get_current_user)):
    """Тестирование системы загрузки файлов"""

    from app.services.file_upload import UPLOAD_DIR

    test_results = {
        "upload_dir": UPLOAD_DIR,
        "upload_dir_exists": os.path.exists(UPLOAD_DIR),
        "upload_dir_writable": os.access(UPLOAD_DIR, os.W_OK) if os.path.exists(UPLOAD_DIR) else False,
        "subfolders": {}
    }

    subfolders = ["images", "blog", "games", "products", "avatars"]
    for subfolder in subfolders:
        subfolder_path = os.path.join(UPLOAD_DIR, subfolder)
        test_results["subfolders"][subfolder] = {
            "path": subfolder_path,
            "exists": os.path.exists(subfolder_path),
            "writable": os.access(subfolder_path, os.W_OK) if os.path.exists(subfolder_path) else False
        }

    return test_results


@router.get("/file/{file_path:path}")
async def get_file(file_path: str):
    """Получение файла по пути"""

    full_path = os.path.join("uploads", file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Файл не найден")

    return FileResponse(full_path)