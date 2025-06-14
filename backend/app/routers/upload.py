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

    # Ограничиваем подпапки для безопасности
    allowed_subfolders = ["images", "blog", "games", "products", "avatars"]
    if subfolder not in allowed_subfolders:
        raise HTTPException(status_code=400, detail="Недопустимая подпапка")

    try:
        file_path = await FileUploadService.save_image(file, subfolder)
        # ИСПРАВЛЕНО: убираем лишние параметры
        file_url = FileUploadService.get_file_url(file_path)

        return {
            "success": True,
            "file_path": file_path,
            "file_url": file_url,
            "message": "Файл успешно загружен"
        }

    except Exception as e:
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
        # ИСПРАВЛЕНО: убираем лишние параметры
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
        raise HTTPException(status_code=404, detail="Файл не найден")

    return {"success": True, "message": "Файл успешно удален"}


@router.get("/file/{file_path:path}")
async def get_file(file_path: str):
    """Получение файла по пути"""

    full_path = os.path.join("uploads", file_path)

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Файл не найден")

    return FileResponse(full_path)


@router.get("/files/list")
async def list_files(
        subfolder: str = "images",
        admin: User = Depends(admin_required)
):
    """Получить список файлов в папке (только для администраторов)"""

    upload_path = os.path.join("uploads", subfolder)

    if not os.path.exists(upload_path):
        return {"files": []}

    files = []
    for filename in os.listdir(upload_path):
        file_path = os.path.join(upload_path, filename)
        if os.path.isfile(file_path):
            file_url = FileUploadService.get_file_url(
                os.path.join(subfolder, filename)
            )
            file_size = os.path.getsize(file_path)

            files.append({
                "filename": filename,
                "file_path": os.path.join(subfolder, filename).replace('\\', '/'),
                "file_url": file_url,
                "size": file_size,
                "size_mb": round(file_size / (1024 * 1024), 2)
            })

    return {"files": files}