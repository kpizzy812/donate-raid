#!/usr/bin/env bash
# db-cleanup.sh - Скрипт для быстрой очистки базы данных
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
    echo -e "${PURPLE}║${WHITE}                    🗄️  DB CLEANUP 🗄️                        ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}               Быстрая очистка базы данных                   ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_menu() {
    echo -e "${WHITE}Выберите действие:${NC}"
    echo ""
    echo -e "${CYAN}🔥 ПОЛНАЯ ОЧИСТКА:${NC}"
    echo -e "  ${GREEN}1)${NC} 💣 Полный сброс БД (drop + create + migrate)"
    echo -e "  ${GREEN}2)${NC} 🔄 Пересоздать БД с миграциями (безопасно)"
    echo ""
    echo -e "${CYAN}📊 ЧАСТИЧНАЯ ОЧИСТКА:${NC}"
    echo -e "  ${GREEN}3)${NC} 🧹 Очистить только данные (оставить структуру)"
    echo -e "  ${GREEN}4)${NC} 🎮 Очистить игры и связанные данные"
    echo -e "  ${GREEN}5)${NC} 👤 Очистить пользователей и заказы"
    echo -e "  ${GREEN}6)${NC} 📝 Очистить поддержку и логи"
    echo ""
    echo -e "${CYAN}🛠️ МИГРАЦИИ:${NC}"
    echo -e "  ${GREEN}7)${NC} ⚡ Сбросить миграции и пересоздать"
    echo -e "  ${GREEN}8)${NC} 🔧 Применить недостающие миграции"
    echo -e "  ${GREEN}9)${NC} 📋 Показать статус миграций"
    echo ""
    echo -e "${CYAN}ℹ️ ИНФОРМАЦИЯ:${NC}"
    echo -e "  ${GREEN}10)${NC} 📊 Показать состояние БД"
    echo -e "  ${GREEN}11)${NC} 🔍 Подключиться к БД"
    echo ""
    echo -e "  ${RED}0)${NC} ❌ Выход"
    echo ""
    echo -e -n "${YELLOW}Ваш выбор [0-11]: ${NC}"
}

confirm_action() {
    local message="$1"
    echo -e "${YELLOW}⚠️  ${message}${NC}"
    echo -e -n "${YELLOW}Продолжить? [y/N]: ${NC}"
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) echo -e "${RED}❌ Отменено${NC}" && return 1 ;;
    esac
}

pause() {
    echo ""
    echo -e -n "${CYAN}Нажмите Enter для продолжения...${NC}"
    read -r
}

# Проверка, что контейнеры запущены
check_containers() {
    if ! docker-compose ps | grep -q "postgres.*Up"; then
        echo -e "${RED}❌ PostgreSQL контейнер не запущен!${NC}"
        echo -e "${YELLOW}Запуск PostgreSQL...${NC}"
        docker-compose up -d postgres
        sleep 5
    fi
}

# 1. Полный сброс БД
full_reset() {
    echo -e "${GREEN}💣 Полный сброс базы данных...${NC}"

    if ! confirm_action "ВСЕ ДАННЫЕ БУДУТ УДАЛЕНЫ! Это действие необратимо!"; then
        return 1
    fi

    check_containers

    echo -e "${BLUE}🗑️ Удаляем базу данных...${NC}"
    docker-compose exec -T postgres psql -U user -d postgres -c "DROP DATABASE IF EXISTS donate_raid;"

    echo -e "${BLUE}🏗️ Создаем новую базу данных...${NC}"
    docker-compose exec -T postgres psql -U user -d postgres -c "CREATE DATABASE donate_raid;"

    echo -e "${BLUE}🔄 Применяем все миграции...${NC}"
    docker-compose exec -T backend alembic upgrade head

    echo -e "${GREEN}✅ База данных полностью пересоздана!${NC}"
}

# 2. Пересоздание с миграциями
recreate_with_migrations() {
    echo -e "${GREEN}🔄 Пересоздание БД с миграциями...${NC}"

    if ! confirm_action "База данных будет пересоздана"; then
        return 1
    fi

    check_containers

    echo -e "${BLUE}⏹️ Останавливаем backend...${NC}"
    docker-compose stop backend bot

    echo -e "${BLUE}🗑️ Удаляем базу данных...${NC}"
    docker-compose exec -T postgres psql -U user -d postgres -c "DROP DATABASE IF EXISTS donate_raid;"
    docker-compose exec -T postgres psql -U user -d postgres -c "CREATE DATABASE donate_raid;"

    echo -e "${BLUE}▶️ Запускаем backend...${NC}"
    docker-compose up -d backend

    sleep 3

    echo -e "${BLUE}🔄 Применяем миграции...${NC}"
    docker-compose exec -T backend alembic upgrade head

    echo -e "${GREEN}✅ База данных пересоздана с миграциями!${NC}"
}

# 3. Очистка только данных
clear_data_only() {
    echo -e "${GREEN}🧹 Очистка данных (структура сохраняется)...${NC}"

    if ! confirm_action "Все данные будут удалены, но структура таблиц сохранится"; then
        return 1
    fi

    check_containers

    echo -e "${BLUE}🧹 Очищаем таблицы...${NC}"
    docker-compose exec -T postgres psql -U user -d donate_raid <<EOF
TRUNCATE TABLE referral_earnings CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE game_input_fields CASCADE;
TRUNCATE TABLE game_subcategories CASCADE;
TRUNCATE TABLE games CASCADE;
TRUNCATE TABLE support_messages CASCADE;
TRUNCATE TABLE auth_tokens CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE articles CASCADE;
EOF

    echo -e "${GREEN}✅ Данные очищены!${NC}"
}

# 4. Очистка игр
clear_games() {
    echo -e "${GREEN}🎮 Очистка игр и связанных данных...${NC}"

    if ! confirm_action "Будут удалены: игры, продукты, заказы, подкатегории, поля ввода"; then
        return 1
    fi

    check_containers

    docker-compose exec -T postgres psql -U user -d donate_raid <<EOF
TRUNCATE TABLE referral_earnings CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE game_input_fields CASCADE;
TRUNCATE TABLE game_subcategories CASCADE;
TRUNCATE TABLE games CASCADE;
EOF

    echo -e "${GREEN}✅ Игры и связанные данные очищены!${NC}"
}

# 5. Очистка пользователей
clear_users() {
    echo -e "${GREEN}👤 Очистка пользователей и заказов...${NC}"

    if ! confirm_action "Будут удалены: пользователи, заказы, токены, реферальные доходы"; then
        return 1
    fi

    check_containers

    docker-compose exec -T postgres psql -U user -d donate_raid <<EOF
TRUNCATE TABLE referral_earnings CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE auth_tokens CASCADE;
TRUNCATE TABLE users CASCADE;
EOF

    echo -e "${GREEN}✅ Пользователи и заказы очищены!${NC}"
}

# 6. Очистка поддержки
clear_support() {
    echo -e "${GREEN}📝 Очистка поддержки...${NC}"

    if ! confirm_action "Будут удалены: сообщения поддержки"; then
        return 1
    fi

    check_containers

    docker-compose exec -T postgres psql -U user -d donate_raid <<EOF
TRUNCATE TABLE support_messages CASCADE;
EOF

    echo -e "${GREEN}✅ Сообщения поддержки очищены!${NC}"
}

# 7. Сброс миграций
reset_migrations() {
    echo -e "${GREEN}⚡ Сброс миграций...${NC}"

    if ! confirm_action "Таблица alembic_version будет очищена и миграции применены заново"; then
        return 1
    fi

    check_containers

    echo -e "${BLUE}🧹 Очищаем историю миграций...${NC}"
    docker-compose exec -T postgres psql -U user -d donate_raid -c "DROP TABLE IF EXISTS alembic_version;"

    echo -e "${BLUE}🔄 Применяем все миграции...${NC}"
    docker-compose exec -T backend alembic upgrade head

    echo -e "${GREEN}✅ Миграции сброшены и применены!${NC}"
}

# 8. Применить миграции
apply_migrations() {
    echo -e "${GREEN}🔧 Применение недостающих миграций...${NC}"

    check_containers

    echo -e "${BLUE}📋 Текущее состояние:${NC}"
    docker-compose exec -T backend alembic current || true

    echo -e "${BLUE}🔄 Применяем миграции...${NC}"
    docker-compose exec -T backend alembic upgrade head

    echo -e "${GREEN}✅ Миграции применены!${NC}"
}

# 9. Статус миграций
migration_status() {
    echo -e "${GREEN}📋 Статус миграций...${NC}"

    check_containers

    echo -e "${BLUE}📊 Текущая ревизия:${NC}"
    docker-compose exec -T backend alembic current

    echo ""
    echo -e "${BLUE}📋 История миграций:${NC}"
    docker-compose exec -T backend alembic history

    echo ""
    echo -e "${BLUE}🔍 Состояние таблиц:${NC}"
    docker-compose exec -T postgres psql -U user -d donate_raid -c "\dt"
}

# 10. Показать состояние БД
show_db_status() {
    echo -e "${GREEN}📊 Состояние базы данных...${NC}"

    check_containers

    echo -e "${BLUE}📋 Список таблиц:${NC}"
    docker-compose exec -T postgres psql -U user -d donate_raid -c "\dt"

    echo ""
    echo -e "${BLUE}📊 Количество записей:${NC}"
    docker-compose exec -T postgres psql -U user -d donate_raid <<EOF
SELECT
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'games', COUNT(*) FROM games
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'game_subcategories', COUNT(*) FROM game_subcategories
UNION ALL SELECT 'game_input_fields', COUNT(*) FROM game_input_fields
UNION ALL SELECT 'support_messages', COUNT(*) FROM support_messages;
EOF
}

# 11. Подключение к БД
connect_to_db() {
    echo -e "${GREEN}🔍 Подключение к базе данных...${NC}"
    echo -e "${YELLOW}Для выхода используйте \\q${NC}"
    echo ""

    check_containers
    docker-compose exec postgres psql -U user -d donate_raid
}

# Основной цикл
main() {
    while true; do
        show_header
        show_menu

        read -r choice
        echo ""

        case $choice in
            1) full_reset && pause ;;
            2) recreate_with_migrations && pause ;;
            3) clear_data_only && pause ;;
            4) clear_games && pause ;;
            5) clear_users && pause ;;
            6) clear_support && pause ;;
            7) reset_migrations && pause ;;
            8) apply_migrations && pause ;;
            9) migration_status && pause ;;
            10) show_db_status && pause ;;
            11) connect_to_db ;;
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

# Проверяем, что мы в корне проекта
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Ошибка: docker-compose.yml не найден!${NC}"
    echo -e "${YELLOW}Убедитесь, что вы находитесь в корне проекта.${NC}"
    exit 1
fi

# Запускаем
main