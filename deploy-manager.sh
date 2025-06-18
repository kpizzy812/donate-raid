#!/usr/bin/env bash
# deploy-manager.sh - Удобный CLI инструмент для управления проектом
set -euo pipefail

# Цвета для красивого вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Настройки
REMOTE_USER="root"
REMOTE_HOST="194.169.160.101"
REMOTE_DIR="/home/donate"
LOCAL_DIR="$(pwd)"

# Функция для вывода заголовка
show_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                    🚀 DEPLOY MANAGER 🚀                      ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}                     DonateRaid Project                       ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Функция для отображения меню
show_menu() {
    echo -e "${WHITE}Выберите действие:${NC}"
    echo ""
    echo -e "${CYAN}📦 ДЕПЛОЙ И СИНХРОНИЗАЦИЯ:${NC}"
    echo -e "  ${GREEN}1)${NC} 🚀 Полный деплой (rsync + build + migrate + restart)"
    echo -e "  ${GREEN}2)${NC} 📁 Быстрая синхронизация кода (только rsync)"
    echo -e "  ${GREEN}3)${NC} 🔧 Настройка сервера (server-setup.sh)"
    echo ""
    echo -e "${CYAN}🐳 УПРАВЛЕНИЕ КОНТЕЙНЕРАМИ:${NC}"
    echo -e "  ${GREEN}4)${NC} ▶️  Запуск всех контейнеров"
    echo -e "  ${GREEN}5)${NC} ⏹️  Остановка всех контейнеров"
    echo -e "  ${GREEN}6)${NC} 🔄 Перезапуск всех контейнеров"
    echo -e "  ${GREEN}7)${NC} 🏗️  Пересборка контейнеров"
    echo ""
    echo -e "${CYAN}📊 МОНИТОРИНГ:${NC}"
    echo -e "  ${GREEN}8)${NC} 📋 Статус контейнеров"
    echo -e "  ${GREEN}9)${NC} 📜 Просмотр логов всех контейнеров"
    echo -e "  ${GREEN}10)${NC} 📈 Живые логи (follow)"
    echo ""
    echo -e "${CYAN}🛠️  РАЗРАБОТКА:${NC}"
    echo -e "  ${GREEN}11)${NC} 🐍 Применить миграции БД"
    echo -e "  ${GREEN}12)${NC} 💾 Бэкап базы данных"
    echo -e "  ${GREEN}13)${NC} 🔍 SSH подключение к серверу"
    echo ""
    echo -e "  ${RED}0)${NC} ❌ Выход"
    echo ""
    echo -e -n "${YELLOW}Ваш выбор [0-13]: ${NC}"
}

# Функция подтверждения для критических операций
confirm_action() {
    local message="$1"
    echo -e "${YELLOW}⚠️  ${message}${NC}"
    echo -e -n "${YELLOW}Продолжить? [y/N]: ${NC}"
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            echo -e "${RED}❌ Отменено${NC}"
            return 1
            ;;
    esac
}

# Функция для паузы
pause() {
    echo ""
    echo -e -n "${CYAN}Нажмите Enter для продолжения...${NC}"
    read -r
}

# 1. Полный деплой
full_deploy() {
    echo -e "${GREEN}🚀 Начинаем полный деплой...${NC}"

    if ! confirm_action "Будет выполнен полный деплой на ${REMOTE_HOST}"; then
        return 1
    fi

    echo -e "${BLUE}📂 Синхронизация файлов...${NC}"
    rsync -az --delete \
        --exclude=".git/" \
        --exclude="node_modules/" \
        --exclude="*.pyc" \
        --exclude="__pycache__/" \
        --exclude=".next/" \
        --exclude="backend/logs/" \
        --exclude="backend/.venv/" \
        "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

    echo -e "${BLUE}🔧 Выполняем деплой на сервере...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        set -euo pipefail
        cd "${REMOTE_DIR}"

        echo "🔧 Проверка окружения..."
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker не установлен! Запустите настройку сервера."
            exit 1
        fi

        if [ ! -f .env ]; then
            echo "⚠️  Создание .env из примера..."
            cp .env.example .env
            sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:8001/api|NEXT_PUBLIC_API_URL=http://${REMOTE_HOST}:8001/api|g" .env
            sed -i "s|FRONTEND_URL=http://localhost:3001|FRONTEND_URL=http://${REMOTE_HOST}:3001|g" .env
        fi

        echo "🛑 Останавливаю контейнеры..."
        docker-compose down --remove-orphans || true

        echo "🔨 Собираю контейнеры..."
        docker-compose build --no-cache

        echo "🚀 Запускаю контейнеры..."
        docker-compose up -d --force-recreate

        echo "⏳ Ждем запуска PostgreSQL..."
        sleep 10

        echo "🗄️  Применение миграций..."
        docker-compose exec -T backend alembic upgrade head || true

        echo "📊 Статус контейнеров:"
        docker-compose ps

        echo "✅ Деплой завершён!"
EOF

    echo -e "${GREEN}🎉 Полный деплой успешно завершен!${NC}"
    echo -e "${CYAN}🌐 Фронтенд: http://${REMOTE_HOST}:3001${NC}"
    echo -e "${CYAN}🔌 API: http://${REMOTE_HOST}:8001${NC}"
}

# 2. Быстрая синхронизация
quick_sync() {
    echo -e "${GREEN}📁 Быстрая синхронизация кода...${NC}"

    echo -e "${BLUE}📂 Синхронизируем файлы...${NC}"
    rsync -az \
        --exclude=".git/" \
        --exclude="node_modules/" \
        --exclude="*.pyc" \
        --exclude="__pycache__/" \
        --exclude=".next/" \
        --exclude="backend/logs/" \
        --exclude="backend/.venv/" \
        "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

    echo -e "${GREEN}✅ Синхронизация завершена!${NC}"
    echo -e "${YELLOW}💡 Для применения изменений может потребоваться перезапуск контейнеров${NC}"
}

# 3. Настройка сервера
setup_server() {
    echo -e "${GREEN}🔧 Настройка сервера...${NC}"

    if ! confirm_action "Будет выполнена настройка сервера ${REMOTE_HOST}"; then
        return 1
    fi

    if [ ! -f "server-setup.sh" ]; then
        echo -e "${RED}❌ Файл server-setup.sh не найден!${NC}"
        return 1
    fi

    echo -e "${BLUE}📤 Копируем скрипт настройки...${NC}"
    scp server-setup.sh "${REMOTE_USER}@${REMOTE_HOST}:/tmp/"

    echo -e "${BLUE}🔧 Запускаем настройку сервера...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"

    echo -e "${GREEN}✅ Настройка сервера завершена!${NC}"
}

# 4. Запуск контейнеров
start_containers() {
    echo -e "${GREEN}▶️ Запуск всех контейнеров...${NC}"

    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose up -d"

    echo -e "${GREEN}✅ Контейнеры запущены!${NC}"
    show_container_status
}

# 5. Остановка контейнеров
stop_containers() {
    echo -e "${GREEN}⏹️ Остановка всех контейнеров...${NC}"

    if ! confirm_action "Все контейнеры будут остановлены"; then
        return 1
    fi

    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose down"

    echo -e "${GREEN}✅ Контейнеры остановлены!${NC}"
}

# 6. Перезапуск контейнеров
restart_containers() {
    echo -e "${GREEN}🔄 Перезапуск всех контейнеров...${NC}"

    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose restart"

    echo -e "${GREEN}✅ Контейнеры перезапущены!${NC}"
    show_container_status
}

# 7. Пересборка контейнеров
rebuild_containers() {
    echo -e "${GREEN}🏗️ Пересборка контейнеров...${NC}"

    if ! confirm_action "Контейнеры будут пересобраны (может занять время)"; then
        return 1
    fi

    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        cd ${REMOTE_DIR}
        echo "🛑 Останавливаем контейнеры..."
        docker-compose down
        echo "🔨 Пересобираем без кэша..."
        docker-compose build --no-cache
        echo "🚀 Запускаем..."
        docker-compose up -d
EOF

    echo -e "${GREEN}✅ Пересборка завершена!${NC}"
    show_container_status
}

# 8. Статус контейнеров
show_container_status() {
    echo -e "${GREEN}📋 Статус контейнеров:${NC}"

    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose ps"
}

# 9. Просмотр логов
show_logs() {
    echo -e "${GREEN}📜 Логи всех контейнеров:${NC}"
    echo -e "${YELLOW}(последние 50 строк для каждого контейнера)${NC}"
    echo ""

    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose logs --tail=50"
}

# 10. Живые логи
follow_logs() {
    echo -e "${GREEN}📈 Живые логи (Ctrl+C для выхода):${NC}"
    echo ""

    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose logs -f"
}

# 11. Применить миграции
apply_migrations() {
    echo -e "${GREEN}🐍 Применение миграций БД...${NC}"

    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        cd ${REMOTE_DIR}
        echo "🗄️  Текущее состояние миграций:"
        docker-compose exec -T backend alembic current || true
        echo ""
        echo "🔄 Применяем миграции..."
        docker-compose exec -T backend alembic upgrade head
        echo "✅ Миграции применены!"
EOF
}

# 12. Бэкап БД
backup_database() {
    echo -e "${GREEN}💾 Создание бэкапа базы данных...${NC}"

    local backup_name="backup_$(date +%Y%m%d_%H%M%S).sql"

    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        cd ${REMOTE_DIR}
        echo "💾 Создаём бэкап: ${backup_name}"
        docker-compose exec -T postgres pg_dump -U postgres donateraid > "backups/${backup_name}"
        echo "✅ Бэкап создан: backups/${backup_name}"
        echo "📁 Список бэкапов:"
        ls -la backups/ || mkdir -p backups
EOF
}

# 13. SSH подключение
ssh_connect() {
    echo -e "${GREEN}🔍 Подключение к серверу...${NC}"
    echo -e "${YELLOW}Вы будете подключены к ${REMOTE_HOST}${NC}"
    echo -e "${YELLOW}Для выхода используйте команду 'exit'${NC}"
    echo ""

    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && bash"
}

# Основной цикл программы
main() {
    while true; do
        show_header
        show_menu

        read -r choice
        echo ""

        case $choice in
            1)
                full_deploy
                pause
                ;;
            2)
                quick_sync
                pause
                ;;
            3)
                setup_server
                pause
                ;;
            4)
                start_containers
                pause
                ;;
            5)
                stop_containers
                pause
                ;;
            6)
                restart_containers
                pause
                ;;
            7)
                rebuild_containers
                pause
                ;;
            8)
                show_container_status
                pause
                ;;
            9)
                show_logs
                pause
                ;;
            10)
                follow_logs
                ;;
            11)
                apply_migrations
                pause
                ;;
            12)
                backup_database
                pause
                ;;
            13)
                ssh_connect
                ;;
            0)
                echo -e "${GREEN}👋 До свидания!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Неверный выбор. Попробуйте снова.${NC}"
                pause
                ;;
        esac
    done
}

# Проверяем, что мы находимся в корне проекта
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Ошибка: docker-compose.yml не найден!${NC}"
    echo -e "${YELLOW}Убедитесь, что вы находитесь в корне проекта.${NC}"
    exit 1
fi

# Запускаем основную программу
main