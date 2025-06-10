#!/usr/bin/env bash
# deploy.sh - Улучшенный скрипт деплоя
set -euo pipefail

# Параметры
REMOTE_USER="root"
REMOTE_HOST="194.169.160.101"
REMOTE_DIR="/home/donate"
LOCAL_DIR="$(pwd)"

echo "🚀 Начинаем деплой на ${REMOTE_HOST}..."

# 1. Rsync: синхронизируем проект
echo "📂 Синхронизация файлов..."
rsync -az --delete \
  --exclude=".git/" \
  --exclude="node_modules/" \
  --exclude="*.pyc" \
  --exclude="__pycache__/" \
  --exclude=".next/" \
  --exclude="backend/logs/" \
  --exclude="backend/.venv/" \
  "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# 2. Подключаемся по SSH и выполняем команды на сервере
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
  set -euo pipefail
  cd "${REMOTE_DIR}"

  echo "🔧 Проверка окружения..."

  # Проверяем Docker
  if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен! Запустите server-setup.sh"
    exit 1
  fi

  # Создаем .env если его нет
  if [ ! -f .env ]; then
    echo "⚠️  Создание .env из примера..."
    cp .env.example .env
    echo "🔑 ВАЖНО: Отредактируйте .env файл перед продакшн запуском!"
  fi

  # Заменяем docker-compose.yml на продакшен версию если есть
  if [ -f docker-compose.prod.yml ]; then
    echo "🔄 Используем продакшен docker-compose..."
    cp docker-compose.prod.yml docker-compose.yml
  fi

  echo "🛑 Останавливаю старые контейнеры..."
  docker-compose down --remove-orphans || true

  echo "🔨 Собираю и запускаю новые контейнеры..."
  docker-compose up --build -d

  # Ждем запуска базы данных
  echo "⏳ Ждем запуска PostgreSQL..."
  sleep 10

  # Применяем миграции
  echo "🗄️  Применение миграций базы данных..."
  docker-compose exec -T backend alembic upgrade head || {
    echo "⚠️  Миграции не применились, возможно БД пустая"
    docker-compose exec -T backend alembic revision --autogenerate -m "initial migration" || true
    docker-compose exec -T backend alembic upgrade head || true
  }

  echo "📊 Статус контейнеров:"
  docker-compose ps

  echo "📝 Последние логи backend:"
  docker-compose logs --tail=20

  echo "✅ Деплой завершён!"
  echo "🌐 Фронтенд: http://${REMOTE_HOST}:3000"
  echo "🔌 API: http://${REMOTE_HOST}:8000"
  echo "📚 API Docs: http://${REMOTE_HOST}:8000/docs"

EOF

echo "🎉 Деплой успешно завершен!"
echo "💡 Полезные команды:"
echo "   ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker-compose logs -f backend'"
echo "   ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker-compose restart backend'"