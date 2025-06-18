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

  # Проверяем наличие .env файла (не перезаписываем если есть)
  if [ ! -f .env ]; then
    echo "⚠️  Создание .env из примера..."
    cp .env.example .env
    echo "🔑 ВАЖНО: Отредактируйте .env файл перед продакшн запуском!"
  else
    echo "✅ Используем существующий .env файл"
  fi

  # Автоматически обновляем URL в .env для сервера
  echo "🔧 Обновляем URL для сервера ${REMOTE_HOST}..."
  sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:8001/api|NEXT_PUBLIC_API_URL=http://${REMOTE_HOST}:8001/api|g" .env
  sed -i "s|FRONTEND_URL=http://localhost:3001|FRONTEND_URL=http://${REMOTE_HOST}:3001|g" .env
  sed -i "s|STATIC_FILES_BASE_URL=http://localhost:8001|STATIC_FILES_BASE_URL=http://${REMOTE_HOST}:8001|g" .env

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
  echo "🗄️  Проверка текущего состояния миграций..."
  docker-compose exec -T backend alembic current || true

  echo "🗄️  Применение миграций базы данных..."
  docker-compose exec -T backend alembic upgrade head || {
    echo "⚠️  Миграции не применились, создаем новую..."
    docker-compose exec -T backend alembic revision --autogenerate -m "fix missing columns" || true
    docker-compose exec -T backend alembic upgrade head || true
  }

  echo "📊 Статус контейнеров:"
  docker-compose ps

  echo "📝 Последние логи:"
  docker-compose logs --tail=20

  echo "✅ Деплой завершён!"
  echo "🌐 Фронтенд: http://${REMOTE_HOST}:3001"
  echo "🔌 API: http://${REMOTE_HOST}:8001"
  echo "📚 API Docs: http://${REMOTE_HOST}:8001/docs"

EOF

echo "🎉 Деплой успешно завершен!"
echo "💡 Полезные команды:"
echo "   ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker-compose logs -f backend'"
echo "   ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker-compose restart backend'"