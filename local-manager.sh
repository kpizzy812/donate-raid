#!/usr/bin/env bash
# local-manager.sh - CLI инструмент для локальной разработки
set -euo pipefail

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

show_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                    💻 LOCAL MANAGER 💻                       ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}                  Локальная разработка                        ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_menu() {
    echo -e "${WHITE}Выберите действие:${NC}"
    echo ""
    echo -e "${CYAN}🐳 DOCKER ЛОКАЛЬНО:${NC}"
    echo -e "  ${GREEN}1)${NC} 🚀 Запуск в Docker (docker-compose up)"
    echo -e "  ${GREEN}2)${NC} ⏹️  Остановка Docker контейнеров"
    echo -e "  ${GREEN}3)${NC} 🔄 Перезапуск Docker контейнеров"
    echo -e "  ${GREEN}4)${NC} 🏗️  Пересборка Docker контейнеров"
    echo -e "  ${GREEN}5)${NC} 📋 Статус Docker контейнеров"
    echo -e "  ${GREEN}6)${NC} 📜 Логи Docker контейнеров"
    echo ""
    echo -e "${CYAN}⚡ РАЗРАБОТКА (без Docker):${NC}"
    echo -e "  ${GREEN}7)${NC} 🐍 Запуск Backend (FastAPI)"
    echo -e "  ${GREEN}8)${NC} 🤖 Запуск Telegram Bot"
    echo -e "  ${GREEN}9)${NC} ⚛️  Запуск Frontend (Next.js)"
    echo -e "  ${GREEN}10)${NC} 📊 Запуск PostgreSQL (Docker)"
    echo ""
    echo -e "${CYAN}🗄️  БАЗА ДАННЫХ:${NC}"
    echo -e "  ${GREEN}11)${NC} 🔄 Применить миграции"
    echo -e "  ${GREEN}12)${NC} 📝 Создать миграцию"
    echo -e "  ${GREEN}13)${NC} 💾 Бэкап локальной БД"
    echo -e "  ${GREEN}14)${NC} 🗃️  Подключиться к БД (psql)"
    echo ""
    echo -e "${CYAN}🛠️  УТИЛИТЫ:${NC}"
    echo -e "  ${GREEN}15)${NC} 📦 Установка зависимостей"
    echo -e "  ${GREEN}16)${NC} 🧹 Очистка (node_modules, __pycache__, .next)"
    echo -e "  ${GREEN}17)${NC} 🔍 Проверка портов"
    echo ""
    echo -e "  ${RED}0)${NC} ❌ Выход"
    echo ""
    echo -e -n "${YELLOW}Ваш выбор [0-17]: ${NC}"
}

pause() {
    echo ""
    echo -e -n "${CYAN}Нажмите Enter для продолжения...${NC}"
    read -r
}

# Docker функции
docker_up() {
    echo -e "${GREEN}🚀 Запуск в Docker...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Контейнеры запущены!${NC}"
    echo -e "${CYAN}🌐 Frontend: http://localhost:3001${NC}"
    echo -e "${CYAN}🔌 API: http://localhost:8001${NC}"
    echo -e "${CYAN}📚 API Docs: http://localhost:8001/docs${NC}"
}

docker_down() {
    echo -e "${GREEN}⏹️ Остановка контейнеров...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Контейнеры остановлены!${NC}"
}

docker_restart() {
    echo -e "${GREEN}🔄 Перезапуск контейнеров...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Контейнеры перезапущены!${NC}"
}

docker_rebuild() {
    echo -e "${GREEN}🏗️ Пересборка контейнеров...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✅ Пересборка завершена!${NC}"
}

docker_status() {
    echo -e "${GREEN}📋 Статус контейнеров:${NC}"
    docker-compose ps
}

docker_logs() {
    echo -e "${GREEN}📜 Логи контейнеров:${NC}"
    docker-compose logs --tail=50
}

# Разработка без Docker
dev_backend() {
    echo -e "${GREEN}🐍 Запуск Backend (FastAPI)...${NC}"
    echo -e "${YELLOW}Порт: 8001${NC}"
    cd backend
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}⚠️ Виртуальное окружение не найдено. Создаём...${NC}"
        python -m venv .venv
        source .venv/bin/activate
        pip install -r requirements.txt
    else
        source .venv/bin/activate
    fi

    echo -e "${BLUE}🚀 Запускаем FastAPI...${NC}"
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
}

dev_bot() {
    echo -e "${GREEN}🤖 Запуск Telegram Bot...${NC}"
    cd backend
    if [ ! -d ".venv" ]; then
        echo -e "${RED}❌ Виртуальное окружение не найдено! Сначала запустите Backend.${NC}"
        return 1
    fi

    source .venv/bin/activate
    echo -e "${BLUE}🚀 Запускаем бота...${NC}"
    python bot/main.py
}

dev_frontend() {
    echo -e "${GREEN}⚛️ Запуск Frontend (Next.js)...${NC}"
    echo -e "${YELLOW}Порт: 3001${NC}"
    cd frontend

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️ node_modules не найден. Устанавливаем зависимости...${NC}"
        npm install
    fi

    echo -e "${BLUE}🚀 Запускаем Next.js...${NC}"
    npm run dev
}

dev_database() {
    echo -e "${GREEN}📊 Запуск PostgreSQL в Docker...${NC}"
    docker-compose up -d postgres
    echo -e "${GREEN}✅ PostgreSQL запущен!${NC}"
    echo -e "${CYAN}📡 Подключение: localhost:5432${NC}"
}

# Функции БД
db_migrate() {
    echo -e "${GREEN}🔄 Применение миграций...${NC}"
    cd backend
    if [ -d ".venv" ]; then
        source .venv/bin/activate
        alembic upgrade head
    else
        echo -e "${YELLOW}Используем Docker...${NC}"
        docker-compose exec backend alembic upgrade head
    fi
    echo -e "${GREEN}✅ Миграции применены!${NC}"
}

db_create_migration() {
    echo -e "${GREEN}📝 Создание новой миграции...${NC}"
    echo -e -n "${YELLOW}Введите описание миграции: ${NC}"
    read -r description

    cd backend
    if [ -d ".venv" ]; then
        source .venv/bin/activate
        alembic revision --autogenerate -m "$description"
    else
        echo -e "${YELLOW}Используем Docker...${NC}"
        docker-compose exec backend alembic revision --autogenerate -m "$description"
    fi
    echo -e "${GREEN}✅ Миграция создана!${NC}"
}

db_backup() {
    echo -e "${GREEN}💾 Бэкап локальной БД...${NC}"
    local backup_name="local_backup_$(date +%Y%m%d_%H%M%S).sql"

    mkdir -p backups
    docker-compose exec -T postgres pg_dump -U postgres donateraid > "backups/$backup_name"
    echo -e "${GREEN}✅ Бэкап создан: backups/$backup_name${NC}"
}

db_connect() {
    echo -e "${GREEN}🗃️ Подключение к БД...${NC}"
    docker-compose exec postgres psql -U postgres -d donateraid
}

# Утилиты
install_deps() {
    echo -e "${GREEN}📦 Установка зависимостей...${NC}"

    echo -e "${BLUE}🐍 Backend зависимости...${NC}"
    cd backend
    if [ ! -d ".venv" ]; then
        python -m venv .venv
    fi
    source .venv/bin/activate
    pip install -r requirements.txt
    cd ..

    echo -e "${BLUE}⚛️ Frontend зависимости...${NC}"
    cd frontend
    npm install
    cd ..

    echo -e "${GREEN}✅ Все зависимости установлены!${NC}"
}

cleanup() {
    echo -e "${GREEN}🧹 Очистка проекта...${NC}"

    echo -e "${BLUE}🗑️ Удаляем node_modules...${NC}"
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

    echo -e "${BLUE}🗑️ Удаляем __pycache__...${NC}"
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

    echo -e "${BLUE}🗑️ Удаляем .next...${NC}"
    rm -rf frontend/.next 2>/dev/null || true

    echo -e "${BLUE}🗑️ Удаляем .pyc файлы...${NC}"
    find . -name "*.pyc" -delete 2>/dev/null || true

    echo -e "${GREEN}✅ Очистка завершена!${NC}"
}

check_ports() {
    echo -e "${GREEN}🔍 Проверка портов...${NC}"
    echo ""

    ports=(3001 8001 5432)
    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            echo -e "${RED}❌ Порт $port занят:${NC}"
            lsof -i :$port
        else
            echo -e "${GREEN}✅ Порт $port свободен${NC}"
        fi
        echo ""
    done
}

# Основной цикл
main() {
    while true; do
        show_header
        show_menu

        read -r choice
        echo ""

        case $choice in
            1) docker_up && pause ;;
            2) docker_down && pause ;;
            3) docker_restart && pause ;;
            4) docker_rebuild && pause ;;
            5) docker_status && pause ;;
            6) docker_logs && pause ;;
            7) dev_backend ;;
            8) dev_bot ;;
            9) dev_frontend ;;
            10) dev_database && pause ;;
            11) db_migrate && pause ;;
            12) db_create_migration && pause ;;
            13) db_backup && pause ;;
            14) db_connect ;;
            15) install_deps && pause ;;
            16) cleanup && pause ;;
            17) check_ports && pause ;;
            0) echo -e "${GREEN}👋 До свидания!${NC}" && exit 0 ;;
            *) echo -e "${RED}❌ Неверный выбор!${NC}" && pause ;;
        esac
    done
}

# Проверяем корень проекта
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Ошибка: docker-compose.yml не найден!${NC}"
    echo -e "${YELLOW}Убедитесь, что вы находитесь в корне проекта.${NC}"
    exit 1
fi

main