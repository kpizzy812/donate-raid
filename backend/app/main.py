# backend/app/main.py - ОБНОВЛЕННАЯ ВЕРСИЯ С WEBSOCKET
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from app.routers import router as api_router
from app.core.logger import logger
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🆕 ДОБАВЛЯЕМ WEBSOCKET РОУТЕР
try:
    from app.routers.websocket_support import router as ws_router
    app.include_router(ws_router, prefix="/api/support")
    logger.info("✅ WebSocket роутер подключен")
except ImportError as e:
    logger.warning(f"⚠️ WebSocket роутер не найден: {e}")
except Exception as e:
    logger.error(f"❌ Ошибка подключения WebSocket: {e}")

# 🆕 Создаем папку uploads и подключаем статические файлы
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
    # Создаем подпапки
    for subfolder in ["products", "images", "blog", "games", "avatars"]:
        os.makedirs(os.path.join(uploads_dir, subfolder), exist_ok=True)

# Подключаем статические файлы для uploads
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"📥 {request.method} {request.url}")
    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception(f"❌ Exception during request: {e}")
        raise
    logger.info(f"📤 {response.status_code} {request.url}")
    return response

app.include_router(api_router)

@app.get("/")
def read_root():
    logger.debug("Root endpoint called")
    return {"message": "Donate Raid API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)