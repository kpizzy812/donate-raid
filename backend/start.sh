#!/bin/bash

# Автозагрузка переменных из корневого .env (если есть)
if [ -f "$(dirname "$0")/../.env" ]; then
  export $(grep -v '^\s*#' "$(dirname "$0")/../.env" | xargs)
fi

echo "🔄 Starting backend and/or bot..."

# Добавляем корневую папку в PYTHONPATH
export PYTHONPATH=.

if [ "$BOT_MODE" = "true" ]; then
  echo "🚀 BOT_MODE=true — запускаем Telegram-бота"
  python bot/main.py
else
  echo "🚀 BOT_MODE=false — запускаем FastAPI"
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi
