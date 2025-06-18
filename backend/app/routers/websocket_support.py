# backend/app/routers/websocket_support.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
import asyncio
from loguru import logger

router = APIRouter()

# Хранилище активных WebSocket соединений
active_connections: Dict[str, List[WebSocket]] = {}


class SupportWebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        """Подключение к комнате чата"""
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        self.active_connections[room_id].append(websocket)
        logger.info(f"WebSocket подключен к комнате {room_id}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        """Отключение от комнаты"""
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)

            # Удаляем пустые комнаты
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        logger.info(f"WebSocket отключен от комнаты {room_id}")

    async def send_message_to_room(self, room_id: str, message: dict):
        """Отправка сообщения всем в комнате"""
        if room_id not in self.active_connections:
            logger.warning(f"Комната {room_id} не найдена")
            return

        # Создаем копию списка соединений
        connections = self.active_connections[room_id].copy()

        for connection in connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Ошибка отправки WebSocket сообщения: {e}")
                # Удаляем битое соединение
                self.disconnect(connection, room_id)


# Глобальный менеджер
ws_manager = SupportWebSocketManager()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """WebSocket endpoint для real-time чата"""
    await ws_manager.connect(websocket, room_id)

    try:
        while True:
            # Ждем сообщения от клиента (для keep-alive)
            data = await websocket.receive_text()
            # Можно добавить обработку входящих сообщений если нужно

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, room_id)


# Функция для уведомления через WebSocket (используется в bot handlers)
async def notify_support_websocket(user_id: int = None, guest_id: str = None, message_data: dict = None):
    """Уведомление через WebSocket о новом сообщении"""

    # Определяем room_id (комнату чата)
    if user_id:
        room_id = f"user_{user_id}"
    elif guest_id:
        room_id = f"guest_{guest_id}"
    else:
        return

    # Отправляем уведомление в комнату
    await ws_manager.send_message_to_room(room_id, {
        "type": "new_message",
        "data": message_data
    })

    logger.info(f"WebSocket уведомление отправлено в комнату {room_id}")