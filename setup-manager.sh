#!/usr/bin/env bash
# setup-manager.sh - Установка и настройка CLI инструментов
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
    echo -e "${PURPLE}║${WHITE}                  🛠️  SETUP MANAGER 🛠️                       ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}             Установка CLI инструментов                       ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_menu() {
    echo -e "${WHITE}Выберите действие:${NC}"
    echo ""
    echo -e "${CYAN}📦 УСТАНОВКА ИНСТРУМЕНТОВ:${NC}"
    echo -e "  ${GREEN}1)${NC} 🚀 Установить Deploy Manager (удаленное управление)"
    echo -e "  ${GREEN}2)${NC} 💻 Установить Local Manager (локальная разработка)"
    echo -e "  ${GREEN}3)${NC} 📋 Установить оба менеджера"
    echo ""
    echo -e "${CYAN}⚙️  НАСТРОЙКА:${NC}"
    echo -e "  ${GREEN}4)${NC} 🔧 Настроить переменные окружения"
    echo -e "  ${GREEN}5)${NC} 🔑 Настроить SSH ключи"
    echo -e "  ${GREEN}6)${NC} 📝 Создать алиасы для быстрого запуска"
    echo ""
    echo -e "${CYAN}🗑️  УДАЛЕНИЕ:${NC}"
    echo -e "  ${GREEN}7)${NC} ❌ Удалить установленные инструменты"
    echo ""
    echo -e "${CYAN}ℹ️  ИНФОРМАЦИЯ:${NC}"
    echo -e "  ${GREEN}8)${NC} 📖 Показать справку по использованию"
    echo -e "  ${GREEN}9)${NC} 🔍 Проверить статус установки"
    echo ""
    echo -e "  ${RED}0)${NC} ❌ Выход"
    echo ""
    echo -e -n "${YELLOW}Ваш выбор [0-9]: ${NC}"
}

pause() {
    echo ""
    echo -e -n "${CYAN}Нажмите Enter для продолжения...${NC}"
    read -r
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

# Установка Deploy Manager
install_deploy_manager() {
    echo -e "${GREEN}🚀 Установка Deploy Manager...${NC}"

    if [ ! -f "deploy-manager.sh" ]; then
        echo -e "${RED}❌ Файл deploy-manager.sh не найден!${NC}"
        echo -e "${YELLOW}Убедитесь, что вы находитесь в корне проекта.${NC}"
        return 1
    fi

    # Копируем в /usr/local/bin для глобального доступа
    if confirm_action "Deploy Manager будет установлен в /usr/local/bin"; then
        sudo cp deploy-manager.sh /usr/local/bin/deploy-manager
        sudo chmod +x /usr/local/bin/deploy-manager
        echo -e "${GREEN}✅ Deploy Manager установлен!${NC}"
        echo -e "${CYAN}💡 Используйте команду: ${WHITE}deploy-manager${NC}"
    fi
}

# Установка Local Manager
install_local_manager() {
    echo -e "${GREEN}💻 Установка Local Manager...${NC}"

    if [ ! -f "local-manager.sh" ]; then
        echo -e "${RED}❌ Файл local-manager.sh не найден!${NC}"
        echo -e "${YELLOW}Убедитесь, что вы находитесь в корне проекта.${NC}"
        return 1
    fi

    if confirm_action "Local Manager будет установлен в /usr/local/bin"; then
        sudo cp local-manager.sh /usr/local/bin/local-manager
        sudo chmod +x /usr/local/bin/local-manager
        echo -e "${GREEN}✅ Local Manager установлен!${NC}"
        echo -e "${CYAN}💡 Используйте команду: ${WHITE}local-manager${NC}"
    fi
}

# Установка обоих менеджеров
install_both() {
    echo -e "${GREEN}📋 Установка обоих менеджеров...${NC}"

    install_deploy_manager
    echo ""
    install_local_manager

    echo ""
    echo -e "${GREEN}🎉 Все инструменты установлены!${NC}"
}

# Настройка переменных окружения
setup_env() {
    echo -e "${GREEN}🔧 Настройка переменных окружения...${NC}"

    echo -e "${BLUE}Настройка для Deploy Manager:${NC}"
    echo -e -n "${YELLOW}IP адрес сервера [194.169.160.101]: ${NC}"
    read -r server_ip
    server_ip=${server_ip:-"194.169.160.101"}

    echo -e -n "${YELLOW}Пользователь на сервере [root]: ${NC}"
    read -r server_user
    server_user=${server_user:-"root"}

    echo -e -n "${YELLOW}Путь на сервере [/home/donate]: ${NC}"
    read -r server_path
    server_path=${server_path:-"/home/donate"}

    # Создаем конфигурационный файл
    cat > ~/.deploy-manager.conf << EOF
# Deploy Manager Configuration
REMOTE_HOST="$server_ip"
REMOTE_USER="$server_user"
REMOTE_DIR="$server_path"
EOF

    echo -e "${GREEN}✅ Конфигурация сохранена в ~/.deploy-manager.conf${NC}"
}

# Настройка SSH ключей
setup_ssh() {
    echo -e "${GREEN}🔑 Настройка SSH ключей...${NC}"

    if [ ! -f ~/.ssh/id_rsa.pub ]; then
        echo -e "${YELLOW}⚠️ SSH ключ не найден. Создаём новый...${NC}"
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    fi

    echo -e "${BLUE}Ваш публичный SSH ключ:${NC}"
    cat ~/.ssh/id_rsa.pub
    echo ""

    echo -e "${YELLOW}Скопируйте этот ключ и добавьте его на сервер в ~/.ssh/authorized_keys${NC}"
    echo ""

    echo -e -n "${YELLOW}Хотите автоматически скопировать ключ на сервер? [y/N]: ${NC}"
    read -r copy_key

    if [[ "$copy_key" =~ ^[yY] ]]; then
        echo -e -n "${YELLOW}IP сервера: ${NC}"
        read -r server_ip
        echo -e -n "${YELLOW}Пользователь: ${NC}"
        read -r server_user

        ssh-copy-id "${server_user}@${server_ip}"
        echo -e "${GREEN}✅ SSH ключ скопирован на сервер!${NC}"
    fi
}

# Создание алиасов
create_aliases() {
    echo -e "${GREEN}📝 Создание алиасов...${NC}"

    # Определяем файл профиля
    if [ -f ~/.zshrc ]; then
        profile_file="$HOME/.zshrc"
    elif [ -f ~/.bashrc ]; then
        profile_file="$HOME/.bashrc"
    else
        profile_file="$HOME/.bash_profile"
    fi

    echo -e "${BLUE}Добавляем алиасы в $profile_file${NC}"

    # Проверяем, есть ли уже наши алиасы
    if ! grep -q "# DonateRaid Manager Aliases" "$profile_file" 2>/dev/null; then
        cat >> "$profile_file" << 'EOF'

# DonateRaid Manager Aliases
alias dm='deploy-manager'          # Deploy Manager
alias lm='local-manager'           # Local Manager
alias dr-deploy='deploy-manager'   # Полное имя
alias dr-local='local-manager'     # Полное имя
EOF
        echo -e "${GREEN}✅ Алиасы добавлены!${NC}"
        echo -e "${CYAN}Доступные команды:${NC}"
        echo -e "  ${WHITE}dm${NC}        - Deploy Manager"
        echo -e "  ${WHITE}lm${NC}        - Local Manager"
        echo -e "  ${WHITE}dr-deploy${NC} - Deploy Manager (полное имя)"
        echo -e "  ${WHITE}dr-local${NC}  - Local Manager (полное имя)"
        echo ""
        echo -e "${YELLOW}💡 Перезапустите терминал или выполните: source $profile_file${NC}"
    else
        echo -e "${YELLOW}⚠️ Алиасы уже существуют в $profile_file${NC}"
    fi
}

# Удаление инструментов
uninstall_tools() {
    echo -e "${GREEN}❌ Удаление установленных инструментов...${NC}"

    if ! confirm_action "Все установленные инструменты будут удалены"; then
        return 1
    fi

    # Удаляем исполняемые файлы
    sudo rm -f /usr/local/bin/deploy-manager
    sudo rm -f /usr/local/bin/local-manager

    # Удаляем конфигурацию
    rm -f ~/.deploy-manager.conf

    echo -e "${GREEN}✅ Инструменты удалены!${NC}"
    echo -e "${YELLOW}💡 Алиасы в профиле нужно удалить вручную${NC}"
}

# Показать справку
show_help() {
    echo -e "${GREEN}📖 Справка по использованию${NC}"
    echo ""
    echo -e "${CYAN}🚀 Deploy Manager:${NC}"
    echo -e "  Инструмент для управления удаленным сервером"
    echo -e "  ${WHITE}Команды:${NC} deploy-manager или dm"
    echo -e "  ${WHITE}Функции:${NC}"
    echo -e "    • Полный деплой проекта"
    echo -e "    • Быстрая синхронизация кода"
    echo -e "    • Управление Docker контейнерами"
    echo -e "    • Просмотр логов"
    echo -e "    • SSH подключение"
    echo ""
    echo -e "${CYAN}💻 Local Manager:${NC}"
    echo -e "  Инструмент для локальной разработки"
    echo -e "  ${WHITE}Команды:${NC} local-manager или lm"
    echo -e "  ${WHITE}Функции:${NC}"
    echo -e "    • Запуск в Docker"
    echo -e "    • Разработка без Docker"
    echo -e "    • Управление базой данных"
    echo -e "    • Установка зависимостей"
    echo ""
    echo -e "${CYAN}📁 Файловая структура:${NC}"
    echo -e "  ${WHITE}/usr/local/bin/deploy-manager${NC} - Deploy Manager"
    echo -e "  ${WHITE}/usr/local/bin/local-manager${NC}  - Local Manager"
    echo -e "  ${WHITE}~/.deploy-manager.conf${NC}        - Конфигурация"
    echo ""
    echo -e "${CYAN}🔧 Настройка:${NC}"
    echo -e "  1. Установите инструменты через этот скрипт"
    echo -e "  2. Настройте переменные окружения"
    echo -e "  3. Настройте SSH ключи для беспарольного доступа"
    echo -e "  4. Создайте алиасы для удобства"
}

# Проверка статуса установки
check_status() {
    echo -e "${GREEN}🔍 Проверка статуса установки${NC}"
    echo ""

    # Проверяем Deploy Manager
    if [ -f /usr/local/bin/deploy-manager ]; then
        echo -e "${GREEN}✅ Deploy Manager установлен${NC}"
    else
        echo -e "${RED}❌ Deploy Manager не установлен${NC}"
    fi

    # Проверяем Local Manager
    if [ -f /usr/local/bin/local-manager ]; then
        echo -e "${GREEN}✅ Local Manager установлен${NC}"
    else
        echo -e "${RED}❌ Local Manager не установлен${NC}"
    fi

    # Проверяем конфигурацию
    if [ -f ~/.deploy-manager.conf ]; then
        echo -e "${GREEN}✅ Конфигурация найдена${NC}"
        echo -e "${BLUE}Содержимое ~/.deploy-manager.conf:${NC}"
        cat ~/.deploy-manager.conf
    else
        echo -e "${YELLOW}⚠️ Конфигурация не найдена${NC}"
    fi

    echo ""

    # Проверяем SSH ключи
    if [ -f ~/.ssh/id_rsa.pub ]; then
        echo -e "${GREEN}✅ SSH ключ найден${NC}"
    else
        echo -e "${YELLOW}⚠️ SSH ключ не найден${NC}"
    fi

    # Проверяем алиасы
    profile_files=("$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile")
    alias_found=false

    for file in "${profile_files[@]}"; do
        if [ -f "$file" ] && grep -q "DonateRaid Manager Aliases" "$file" 2>/dev/null; then
            echo -e "${GREEN}✅ Алиасы найдены в $file${NC}"
            alias_found=true
            break
        fi
    done

    if [ "$alias_found" = false ]; then
        echo -e "${YELLOW}⚠️ Алиасы не найдены${NC}"
    fi
}

# Основной цикл
main() {
    while true; do
        show_header
        show_menu

        read -r choice
        echo ""

        case $choice in
            1)
                install_deploy_manager
                pause
                ;;
            2)
                install_local_manager
                pause
                ;;
            3)
                install_both
                pause
                ;;
            4)
                setup_env
                pause
                ;;
            5)
                setup_ssh
                pause
                ;;
            6)
                create_aliases
                pause
                ;;
            7)
                uninstall_tools
                pause
                ;;
            8)
                show_help
                pause
                ;;
            9)
                check_status
                pause
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

# Проверяем права на запись в /usr/local/bin
if [ ! -w /usr/local/bin ] 2>/dev/null; then
    echo -e "${YELLOW}⚠️ Для установки потребуются права sudo${NC}"
fi

echo -e "${GREEN}🛠️ Setup Manager для DonateRaid Project${NC}"
echo -e "${CYAN}Этот скрипт поможет установить и настроить CLI инструменты для управления проектом${NC}"
echo ""

main