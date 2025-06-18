#!/bin/bash
# server-setup.sh - Скрипт для первичной настройки сервера

set -euo pipefail

echo "🚀 Настройка сервера для DonateRaid..."

# Обновляем систему
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Устанавливаем Docker
echo "🐳 Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Добавляем пользователя в группу docker
    usermod -aG docker $USER

    # Устанавливаем Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker уже установлен"
fi

# Создаем директорию проекта
echo "📁 Создание директории проекта..."
mkdir -p /home/donate
cd /home/donate

# Устанавливаем дополнительные утилиты
echo "🔧 Установка дополнительных утилит..."
apt install -y htop nano curl wget git rsync

echo "✅ Базовая настройка сервера завершена!"
echo "🔗 Теперь можно запустить деплой с локальной машины"