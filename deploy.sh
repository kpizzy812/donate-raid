#!/usr/bin/env bash
set -euo pipefail

# Параметры
REMOTE_USER="root"
REMOTE_HOST="194.169.160.101"
REMOTE_DIR="/home/donate"
LOCAL_DIR="$(pwd)"

# Rsync: синхронизируем весь проект (включая .env) на сервер
rsync -az --delete \
  --exclude=".git/" \
  --exclude="node_modules/" \
  --exclude="*.pyc" \
  "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# Подключаемся по SSH и перезапускаем контейнеры
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
  set -euo pipefail
  cd "${REMOTE_DIR}"
  echo "Останавливаю старые контейнеры..."
  docker-compose down

  echo "Собираю и запускаю новые контейнеры..."
  docker-compose up --build

  echo "Деплой завершён."
EOF
