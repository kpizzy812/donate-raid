#!/usr/bin/env bash
# deploy-manager.sh - Удобный CLI инструмент для управления проектом
set -eo pipefail  # ИСПРАВЛЕНО: убрали флаг -u

# Цвета для красивого вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Настройки (можно изменить в ~/.deploy-manager.conf)
DEFAULT_REMOTE_USER="root"
DEFAULT_REMOTE_HOST="87.120.166.236"
DEFAULT_REMOTE_DIR="/home/donate"

# Загружаем конфигурацию если есть
CONFIG_FILE="$HOME/.deploy-manager.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Используем значения из конфига или дефолтные
REMOTE_USER="${REMOTE_USER:-$DEFAULT_REMOTE_USER}"
REMOTE_HOST="${REMOTE_HOST:-$DEFAULT_REMOTE_HOST}"
REMOTE_DIR="${REMOTE_DIR:-$DEFAULT_REMOTE_DIR}"
LOCAL_DIR="$(pwd)"

# Функция для вывода заголовка
show_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                    🚀 DEPLOY MANAGER 🚀                      ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}                     DonateRaid Project                       ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${YELLOW}                         macOS                                ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🌐 Сервер: ${WHITE}${REMOTE_USER}@${REMOTE_HOST}${NC}"
    echo -e "${CYAN}📁 Директория: ${WHITE}${REMOTE_DIR}${NC}"
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
    echo ""
    echo -e "${CYAN}💾 БЭКАПЫ:${NC}"
    echo -e "  ${GREEN}12)${NC} 💾 Создать и скачать бэкап БД"
    echo -e "  ${GREEN}13)${NC} 📥 Скачать существующий бэкап"
    echo -e "  ${GREEN}14)${NC} 🧹 Очистить старые бэкапы"
    echo ""
    echo -e "${CYAN}🔧 СИСТЕМА:${NC}"
    echo -e "  ${GREEN}15)${NC} 🔍 SSH подключение к серверу"
    echo ""
    echo -e "  ${RED}0)${NC} ❌ Выход"
    echo ""
    echo -e -n "${YELLOW}Ваш выбор [0-15]: ${NC}"
}

# Функция подтверждения для критических операций
confirm_action() {
    local message="$1"
    echo -e "${YELLOW}⚠️  ${message}${NC}"
    echo -e -n "${YELLOW}Продолжить? [y/N]: ${NC}"
    local response=""
    read -r response || true  # ИСПРАВЛЕНО: добавили || true
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
    read -r || true  # ИСПРАВЛЕНО: добавили || true
}

# Проверяем требования
check_requirements() {
    local missing_tools=()

    if ! command -v ssh >/dev/null 2>&1; then
        missing_tools+=("ssh")
    fi

    if ! command -v scp >/dev/null 2>&1; then
        missing_tools+=("scp")
    fi

    if ! command -v rsync >/dev/null 2>&1; then
        missing_tools+=("rsync")
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo -e "${RED}❌ Отсутствуют необходимые инструменты: ${missing_tools[*]}${NC}"
        echo -e "${YELLOW}💡 Установите их через Homebrew: brew install openssh rsync${NC}"
        return 1
    fi

    return 0
}

check_important_dirs() {
    echo -e "${CYAN}🔍 Проверяем важные директории на сервере...${NC}"

    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        cd ${REMOTE_DIR}
        echo "📁 Проверяем uploads/:"
        if [ -d "uploads" ]; then
            echo "  ✅ uploads/ существует ($(find uploads -type f | wc -l) файлов)"
        else
            echo "  ⚠️ uploads/ не найдена"
        fi

        echo "📁 Проверяем logs/:"
        if [ -d "logs" ]; then
            echo "  ✅ logs/ существует"
        else
            echo "  ⚠️ logs/ не найдена"
        fi

        echo "📁 Проверяем backups/:"
        if [ -d "backups" ]; then
            echo "  ✅ backups/ существует ($(find backups -name "*.sql" | wc -l) бэкапов)"
        else
            echo "  ⚠️ backups/ не найдена"
        fi
EOF
}

# 1. Полный деплой
full_deploy() {
    echo -e "${GREEN}🚀 Начинаем полный деплой...${NC}"

    if ! confirm_action "Будет выполнен полный деплой (может занять время)"; then
        return 1
    fi

    echo -e "${YELLOW}🔹 Шаг 1: Синхронизация файлов...${NC}"
    rsync -avz --delete \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='venv' \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='.env' \
    --exclude='backups' \
    --exclude='uploads' \
    --exclude='logs' \
        "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

    echo -e "${YELLOW}🔹 Шаг 2: Остановка контейнеров...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml down"

    echo -e "${YELLOW}🔹 Шаг 3: Пересборка контейнеров...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml build --no-cache"

    echo -e "${YELLOW}🔹 Шаг 4: Запуск контейнеров...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml up -d"

    echo -e "${YELLOW}🔹 Шаг 5: Применение миграций...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head"

    echo -e "${GREEN}✅ Деплой завершён!${NC}"
    show_container_status
}

# 2. Быстрая синхронизация
quick_sync() {
    echo -e "${GREEN}📁 Быстрая синхронизация кода...${NC}"

    echo -e "${BLUE}📂 Синхронизируем файлы...${NC}"
    rsync -avz --delete \
        --exclude='.next' \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='venv' \
        --exclude='.venv' \
        --exclude='__pycache__' \
        --exclude='.env' \
        --exclude='backups' \
        --exclude='uploads' \
        --exclude='logs' \
            "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

    echo -e "${GREEN}✅ Синхронизация завершена!${NC}"
    echo -e "${YELLOW}💡 Для применения изменений может потребоваться перезапуск контейнеров${NC}"
}

# 3. Настройка сервера
setup_server() {
    echo -e "${GREEN}🔧 Запуск настройки сервера...${NC}"

    # Сначала синхронизируем файлы
    quick_sync

    # Запускаем скрипт настройки
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && chmod +x server-setup.sh && ./server-setup.sh"

    echo -e "${GREEN}✅ Настройка сервера завершена!${NC}"
}

# 4-7. Управление контейнерами
start_containers() {
    echo -e "${GREEN}▶️ Запуск всех контейнеров...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml up -d"
    echo -e "${GREEN}✅ Контейнеры запущены!${NC}"
    show_container_status
}

stop_containers() {
    echo -e "${GREEN}⏹️ Остановка всех контейнеров...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml down"
    echo -e "${GREEN}✅ Контейнеры остановлены!${NC}"
}

restart_containers() {
    echo -e "${GREEN}🔄 Перезапуск всех контейнеров...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml restart"
    echo -e "${GREEN}✅ Контейнеры перезапущены!${NC}"
    show_container_status
}

rebuild_containers() {
    echo -e "${GREEN}🏗️ Пересборка контейнеров...${NC}"

    if ! confirm_action "Контейнеры будут пересобраны (может занять время)"; then
        return 1
    fi

    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        cd ${REMOTE_DIR}
        echo "🛑 Останавливаем контейнеры..."
        docker-compose -f docker-compose.prod.yml down
        echo "🔨 Пересобираем без кэша..."
        docker-compose -f docker-compose.prod.yml build --no-cache
        echo "🚀 Запускаем..."
        docker-compose -f docker-compose.prod.yml up -d
EOF

    echo -e "${GREEN}✅ Пересборка завершена!${NC}"
    show_container_status
}

# 8. Статус контейнеров
show_container_status() {
    echo -e "${GREEN}📋 Статус контейнеров:${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml ps"
}

# 9. Просмотр логов
show_logs() {
    echo -e "${GREEN}📜 Логи всех контейнеров:${NC}"
    echo -e "${YELLOW}(последние 50 строк для каждого контейнера)${NC}"
    echo ""
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml logs --tail=50"
}

# 10. Живые логи
follow_logs() {
    echo -e "${GREEN}📈 Живые логи (Ctrl+C для выхода):${NC}"
    echo ""
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml logs -f"
}

# 11. Применить миграции
apply_migrations() {
    echo -e "${GREEN}🐍 Применение миграций БД...${NC}"

    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        cd ${REMOTE_DIR}
        echo "🗄️  Текущее состояние миграций:"
        docker-compose -f docker-compose.prod.yml exec -T backend alembic current || true
        echo ""
        echo "🔄 Применяем миграции..."
        docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
        echo "✅ Миграции применены!"
EOF
}

# 12. Бэкап БД с автоматическим скачиванием
backup_database() {
    echo -e "${GREEN}💾 Создание и скачивание бэкапа базы данных...${NC}"

    local backup_name="backup_$(date +%Y%m%d_%H%M%S).sql"
    local local_backups_dir="./backups"

    # Создаем локальную папку для бэкапов если её нет
    mkdir -p "${local_backups_dir}"

    echo -e "${YELLOW}🔹 Создаем бэкап на сервере...${NC}"

    # ИСПРАВЛЕНО: Используем правильные параметры подключения
    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        cd ${REMOTE_DIR}
        echo "💾 Создаём бэкап: ${backup_name}"
        mkdir -p backups

        # ИСПРАВЛЕНО: пользователь 'user', база 'donate_raid'
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U user -d donate_raid > "backups/${backup_name}"

        echo "✅ Бэкап создан на сервере: backups/${backup_name}"
        echo "📏 Размер файла:"
        ls -lh "backups/${backup_name}"
EOF

    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}🔹 Скачиваем бэкап на локальную машину...${NC}"

        # Скачиваем файл с сервера
        if scp "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/backups/${backup_name}" "${local_backups_dir}/${backup_name}"; then
            echo -e "${GREEN}✅ Бэкап успешно скачан!${NC}"
            echo -e "${CYAN}📁 Локальный файл: ${local_backups_dir}/${backup_name}${NC}"
            echo -e "${CYAN}📏 Размер: $(ls -lh "${local_backups_dir}/${backup_name}" | awk '{print $5}')${NC}"

            # Показываем список локальных бэкапов
            echo -e "${YELLOW}📋 Локальные бэкапы:${NC}"
            ls -lh "${local_backups_dir}/"*.sql 2>/dev/null || echo "  (нет других файлов)"
        else
            echo -e "${RED}❌ Ошибка скачивания файла${NC}"
            echo -e "${YELLOW}💡 Файл остался на сервере: ${REMOTE_HOST}:${REMOTE_DIR}/backups/${backup_name}${NC}"
        fi
    else
        echo -e "${RED}❌ Ошибка создания бэкапа на сервере${NC}"
    fi

    # Показываем список бэкапов на сервере
    echo -e "${YELLOW}📋 Бэкапы на сервере:${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "ls -lh ${REMOTE_DIR}/backups/*.sql 2>/dev/null || echo '  (нет файлов)'"
}

# 13. Скачать существующий бэкап с сервера
download_backup() {
    echo -e "${GREEN}📥 Скачивание бэкапа с сервера...${NC}"

    local local_backups_dir="./backups"
    mkdir -p "${local_backups_dir}"

    # Показываем список бэкапов на сервере
    echo -e "${YELLOW}📋 Доступные бэкапы на сервере:${NC}"

    # Получаем список файлов и нумеруем их
    local backup_list=$(ssh "${REMOTE_USER}@${REMOTE_HOST}" "ls ${REMOTE_DIR}/backups/*.sql 2>/dev/null | sort -r")

    if [ -z "$backup_list" ]; then
        echo -e "${RED}❌ На сервере нет бэкапов${NC}"
        return 1
    fi

    local i=1
    declare -a backups_array

    while IFS= read -r backup_path; do
        local backup_file=$(basename "$backup_path")
        local file_size=$(ssh "${REMOTE_USER}@${REMOTE_HOST}" "ls -lh '$backup_path' | awk '{print \$5}'")
        local file_date=$(ssh "${REMOTE_USER}@${REMOTE_HOST}" "ls -l '$backup_path' | awk '{print \$6, \$7, \$8}'")

        echo -e "  ${GREEN}$i)${NC} $backup_file (${file_size}, ${file_date})"
        backups_array[$i]="$backup_file"
        ((i++))
    done <<< "$backup_list"

    echo ""
    echo -e -n "${YELLOW}Выберите номер бэкапа для скачивания [1-$((i-1))] или 0 для отмены: ${NC}"
    local choice=""
    read -r choice || true  # ИСПРАВЛЕНО: добавили || true

    if [[ "$choice" =~ ^[1-9][0-9]*$ ]] && [ "$choice" -le $((i-1)) ]; then
        local selected_backup="${backups_array[$choice]}"
        echo -e "${YELLOW}🔹 Скачиваем: $selected_backup${NC}"

        if scp "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/backups/${selected_backup}" "${local_backups_dir}/${selected_backup}"; then
            echo -e "${GREEN}✅ Бэкап успешно скачан!${NC}"
            echo -e "${CYAN}📁 Локальный файл: ${local_backups_dir}/${selected_backup}${NC}"
        else
            echo -e "${RED}❌ Ошибка скачивания${NC}"
        fi
    elif [ "$choice" = "0" ]; then
        echo -e "${YELLOW}❌ Отменено${NC}"
    else
        echo -e "${RED}❌ Неверный выбор${NC}"
    fi
}

# 14. Очистка старых бэкапов
cleanup_backups() {
    echo -e "${GREEN}🧹 Очистка старых бэкапов...${NC}"

    echo -e "${YELLOW}Выберите что очистить:${NC}"
    echo -e "  ${GREEN}1)${NC} Локальные бэкапы (старше 7 дней)"
    echo -e "  ${GREEN}2)${NC} Серверные бэкапы (старше 30 дней)"
    echo -e "  ${GREEN}3)${NC} И локальные, и серверные"
    echo -e "  ${RED}0)${NC} Отмена"
    echo ""
    echo -e -n "${YELLOW}Ваш выбор [0-3]: ${NC}"
    local choice=""
    read -r choice || true  # ИСПРАВЛЕНО: добавили || true

    case "$choice" in
        1)
            cleanup_local_backups
            ;;
        2)
            cleanup_server_backups
            ;;
        3)
            cleanup_local_backups
            cleanup_server_backups
            ;;
        0)
            echo -e "${YELLOW}❌ Отменено${NC}"
            ;;
        *)
            echo -e "${RED}❌ Неверный выбор${NC}"
            ;;
    esac
}

# Очистка локальных бэкапов
cleanup_local_backups() {
    local local_backups_dir="./backups"

    if [ ! -d "$local_backups_dir" ]; then
        echo -e "${YELLOW}⚠️ Папка локальных бэкапов не найдена${NC}"
        return
    fi

    echo -e "${YELLOW}🔹 Поиск локальных бэкапов старше 7 дней...${NC}"

    local old_files=$(find "$local_backups_dir" -name "backup_*.sql" -type f -mtime +7 2>/dev/null)

    if [ -z "$old_files" ]; then
        echo -e "${GREEN}✅ Нет старых локальных бэкапов для удаления${NC}"
        return
    fi

    echo -e "${YELLOW}📋 Найдены старые файлы:${NC}"
    echo "$old_files" | while read -r file; do
        echo -e "  📄 $(basename "$file") ($(ls -lh "$file" | awk '{print $6, $7, $8}'))"
    done

    if confirm_action "Удалить эти локальные файлы?"; then
        echo "$old_files" | xargs rm -f
        echo -e "${GREEN}✅ Старые локальные бэкапы удалены${NC}"
    fi
}

# Очистка серверных бэкапов
cleanup_server_backups() {
    echo -e "${YELLOW}🔹 Поиск серверных бэкапов старше 30 дней...${NC}"

    ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        cd ${REMOTE_DIR}/backups 2>/dev/null || { echo "Папка бэкапов на сервере не найдена"; exit 1; }

        old_files=\$(find . -name "backup_*.sql" -type f -mtime +30 2>/dev/null)

        if [ -z "\$old_files" ]; then
            echo "✅ Нет старых серверных бэкапов для удаления"
            exit 0
        fi

        echo "📋 Найдены старые файлы на сервере:"
        echo "\$old_files" | while read -r file; do
            echo "  📄 \$(basename "\$file") (\$(ls -lh "\$file" | awk '{print \$6, \$7, \$8}'))"
        done

        # Сохраняем список для удаления
        echo "\$old_files" > /tmp/old_backups.txt
EOF

    if [ $? -eq 0 ]; then
        if confirm_action "Удалить старые серверные бэкапы?"; then
            ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
                cd ${REMOTE_DIR}/backups
                if [ -f /tmp/old_backups.txt ]; then
                    cat /tmp/old_backups.txt | xargs rm -f
                    rm -f /tmp/old_backups.txt
                    echo "✅ Старые серверные бэкапы удалены"
                fi
EOF
        fi
    fi
}

# 15. SSH подключение
ssh_connect() {
    echo -e "${GREEN}🔍 Подключение к серверу...${NC}"
    echo -e "${YELLOW}Вы будете подключены к ${REMOTE_HOST}${NC}"
    echo -e "${YELLOW}Для выхода используйте команду 'exit'${NC}"
    echo ""

    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && bash"
}

# Основной цикл программы
main() {
    # Проверяем требования
    if ! check_requirements; then
        pause
        exit 1
    fi

    while true; do
        show_header
        show_menu

        local choice=""
        read -r choice || true  # ИСПРАВЛЕНО: добавили || true
        echo ""

        case "${choice:-}" in  # ИСПРАВЛЕНО: добавили :-
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
                download_backup
                pause
                ;;
            14)
                cleanup_backups
                pause
                ;;
            15)
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
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Ошибка: docker-compose файлы не найдены!${NC}"
    echo -e "${YELLOW}Убедитесь, что вы находитесь в корне проекта.${NC}"
    exit 1
fi

# Запускаем основную программу
main