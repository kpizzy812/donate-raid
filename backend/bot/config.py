import os

TG_BOT_TOKEN = os.getenv("TG_BOT_TOKEN")
ADMIN_CHAT_IDS = [
    int(chat_id.strip()) for chat_id in os.getenv("TG_ADMIN_CHAT_IDS", "").split(",") if chat_id.strip().isdigit()
]
