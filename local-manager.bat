@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: deploy-manager.bat - Управление удаленным сервером (Windows)
title Deploy Manager - DonateRaid Project

:: Настройки (можно изменить)
set REMOTE_USER=root
set REMOTE_HOST=194.169.160.101
set REMOTE_DIR=/home/donate

:: Цвета для Windows
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set PURPLE=[95m
set CYAN=[96m
set WHITE=[97m
set NC=[0m

:show_header
cls
echo %PURPLE%╔══════════════════════════════════════════════════════════════╗%NC%
echo %PURPLE%║%WHITE%                    🚀 DEPLOY MANAGER 🚀                      %PURPLE%║%NC%
echo %PURPLE%║%CYAN%                     DonateRaid Project                       %PURPLE%║%NC%
echo %PURPLE%║%YELLOW%                        Windows                              %PURPLE%║%NC%
echo %PURPLE%╚══════════════════════════════════════════════════════════════╝%NC%
echo.
goto :show_menu

:show_menu
echo %WHITE%Выберите действие:%NC%
echo.
echo %CYAN%📦 ДЕПЛОЙ И СИНХРОНИЗАЦИЯ:%NC%
echo   %GREEN%1%NC% - 🚀 Полный деплой (rsync + build + migrate + restart)
echo   %GREEN%2%NC% - 📁 Быстрая синхронизация кода (только rsync)
echo   %GREEN%3%NC% - 🔧 Настройка сервера (server-setup.sh)
echo.
echo %CYAN%🐳 УПРАВЛЕНИЕ КОНТЕЙНЕРАМИ:%NC%
echo   %GREEN%4%NC% - ▶️  Запуск всех контейнеров
echo   %GREEN%5%NC% - ⏹️  Остановка всех контейнеров
echo   %GREEN%6%NC% - 🔄 Перезапуск всех контейнеров
echo   %GREEN%7%NC% - 🏗️  Пересборка контейнеров
echo.
echo %CYAN%📊 МОНИТОРИНГ:%NC%
echo   %GREEN%8%NC% - 📋 Статус контейнеров
echo   %GREEN%9%NC% - 📜 Просмотр логов всех контейнеров
echo   %GREEN%10%NC% - 📈 Живые логи (follow)
echo.
echo %CYAN%🛠️ РАЗРАБОТКА:%NC%
echo   %GREEN%11%NC% - 🐍 Применить миграции БД
echo   %GREEN%12%NC% - 💾 Бэкап базы данных
echo   %GREEN%13%NC% - 🔍 SSH подключение к серверу
echo.
echo   %RED%0%NC% - ❌ Выход
echo.
set /p choice=%YELLOW%Ваш выбор [0-13]: %NC%

if "%choice%"=="1" goto :full_deploy
if "%choice%"=="2" goto :quick_sync
if "%choice%"=="3" goto :setup_server
if "%choice%"=="4" goto :start_containers
if "%choice%"=="5" goto :stop_containers
if "%choice%"=="6" goto :restart_containers
if "%choice%"=="7" goto :rebuild_containers
if "%choice%"=="8" goto :show_container_status
if "%choice%"=="9" goto :show_logs
if "%choice%"=="10" goto :follow_logs
if "%choice%"=="11" goto :apply_migrations
if "%choice%"=="12" goto :backup_database
if "%choice%"=="13" goto :ssh_connect
if "%choice%"=="0" goto :exit
goto :invalid_choice

:check_requirements
:: Проверяем наличие необходимых инструментов
where ssh >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ SSH не найден! Установите OpenSSH или Git Bash%NC%
    echo %YELLOW%💡 Или используйте WSL/PowerShell%NC%
    pause
    goto :show_header
)

where scp >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ SCP не найден! Установите OpenSSH%NC%
    pause
    goto :show_header
)
goto :eof

:confirm_action
echo %YELLOW%⚠️  %~1%NC%
set /p response=%YELLOW%Продолжить? [y/N]: %NC%
if /i "%response%"=="y" goto :eof
if /i "%response%"=="yes" goto :eof
echo %RED%❌ Отменено%NC%
pause
goto :show_header

:full_deploy
call :check_requirements
echo %GREEN%🚀 Начинаем полный деплой...%NC%
call :confirm_action "Будет выполнен полный деплой на %REMOTE_HOST%"

echo %BLUE%📂 Синхронизация файлов...%NC%

:: Для Windows используем scp вместо rsync (или rsync из WSL)
if exist "%ProgramFiles%\Git\usr\bin\rsync.exe" (
    "%ProgramFiles%\Git\usr\bin\rsync.exe" -az --delete --exclude=".git/" --exclude="node_modules/" --exclude="*.pyc" --exclude="__pycache__/" --exclude=".next/" --exclude="backend/logs/" --exclude="backend/.venv/" ./ %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
) else (
    echo %YELLOW%⚠️ Rsync не найден, используем scp...%NC%
    scp -r . %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
)

echo %BLUE%🔧 Выполняем деплой на сервере...%NC%
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && bash -c 'set -euo pipefail; echo \"🔧 Проверка окружения...\"; if ! command -v docker >/dev/null; then echo \"❌ Docker не установлен!\"; exit 1; fi; if [ ! -f .env ]; then echo \"⚠️ Создание .env...\"; cp .env.example .env; sed -i \"s|localhost:8001|%REMOTE_HOST%:8001|g\" .env; fi; echo \"🛑 Останавливаю контейнеры...\"; docker-compose down --remove-orphans || true; echo \"🔨 Собираю контейнеры...\"; docker-compose build --no-cache; echo \"🚀 Запускаю контейнеры...\"; docker-compose up -d --force-recreate; echo \"⏳ Ждем PostgreSQL...\"; sleep 10; echo \"🗄️ Применение миграций...\"; docker-compose exec -T backend alembic upgrade head || true; echo \"📊 Статус:\"; docker-compose ps; echo \"✅ Деплой завершён!\"'"

echo %GREEN%🎉 Полный деплой успешно завершен!%NC%
echo %CYAN%🌐 Фронтенд: http://%REMOTE_HOST%:3001%NC%
echo %CYAN%🔌 API: http://%REMOTE_HOST%:8001%NC%
pause
goto :show_header

:quick_sync
call :check_requirements
echo %GREEN%📁 Быстрая синхронизация кода...%NC%

if exist "%ProgramFiles%\Git\usr\bin\rsync.exe" (
    "%ProgramFiles%\Git\usr\bin\rsync.exe" -az --exclude=".git/" --exclude="node_modules/" --exclude="*.pyc" --exclude="__pycache__/" --exclude=".next/" --exclude="backend/logs/" --exclude="backend/.venv/" ./ %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
) else (
    scp -r . %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/
)

echo %GREEN%✅ Синхронизация завершена!%NC%
echo %YELLOW%💡 Для применения изменений может потребоваться перезапуск контейнеров%NC%
pause
goto :show_header

:setup_server
call :check_requirements
echo %GREEN%🔧 Настройка сервера...%NC%
call :confirm_action "Будет выполнена настройка сервера %REMOTE_HOST%"

if not exist "server-setup.sh" (
    echo %RED%❌ Файл server-setup.sh не найден!%NC%
    pause
    goto :show_header
)

echo %BLUE%📤 Копируем скрипт настройки...%NC%
scp server-setup.sh %REMOTE_USER%@%REMOTE_HOST%:/tmp/

echo %BLUE%🔧 Запускаем настройку сервера...%NC%
ssh %REMOTE_USER%@%REMOTE_HOST% "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"

echo %GREEN%✅ Настройка сервера завершена!%NC%
pause
goto :show_header

:start_containers
call :check_requirements
echo %GREEN%▶️ Запуск всех контейнеров...%NC%
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose up -d"
echo %GREEN%✅ Контейнеры запущены!%NC%
call :show_container_status_inline
pause
goto :show_header

:stop_containers
call :check_requirements
echo %GREEN%⏹️ Остановка всех контейнеров...%NC%
call :confirm_action "Все контейнеры будут остановлены"
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose down"
echo %GREEN%✅ Контейнеры остановлены!%NC%
pause
goto :show_header

:restart_containers
call :check_requirements
echo %GREEN%🔄 Перезапуск всех контейнеров...%NC%
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose restart"
echo %GREEN%✅ Контейнеры перезапущены!%NC%
call :show_container_status_inline
pause
goto :show_header

:rebuild_containers
call :check_requirements
echo %GREEN%🏗️ Пересборка контейнеров...%NC%
call :confirm_action "Контейнеры будут пересобраны (может занять время)"
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && echo '🛑 Останавливаем...' && docker-compose down && echo '🔨 Пересобираем...' && docker-compose build --no-cache && echo '🚀 Запускаем...' && docker-compose up -d"
echo %GREEN%✅ Пересборка завершена!%NC%
call :show_container_status_inline
pause
goto :show_header

:show_container_status
echo %GREEN%📋 Статус контейнеров:%NC%
call :show_container_status_inline
pause
goto :show_header

:show_container_status_inline
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose ps"
goto :eof

:show_logs
call :check_requirements
echo %GREEN%📜 Логи всех контейнеров:%NC%
echo %YELLOW%(последние 50 строк для каждого контейнера)%NC%
echo.
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose logs --tail=50"
pause
goto :show_header

:follow_logs
call :check_requirements
echo %GREEN%📈 Живые логи (Ctrl+C для выхода):%NC%
echo.
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && docker-compose logs -f"
goto :show_header

:apply_migrations
call :check_requirements
echo %GREEN%🐍 Применение миграций БД...%NC%
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && echo '🗄️ Текущее состояние:' && docker-compose exec -T backend alembic current && echo '' && echo '🔄 Применяем миграции...' && docker-compose exec -T backend alembic upgrade head && echo '✅ Миграции применены!'"
pause
goto :show_header

:backup_database
call :check_requirements
echo %GREEN%💾 Создание бэкапа базы данных...%NC%
for /f "tokens=2 delims==" %%I in ('wmic OS Get localdatetime /value') do set "dt=%%I"
set "backup_name=backup_%dt:~0,8%_%dt:~8,6%.sql"
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && echo '💾 Создаём бэкап: %backup_name%' && mkdir -p backups && docker-compose exec -T postgres pg_dump -U postgres donateraid > 'backups/%backup_name%' && echo '✅ Бэкап создан: backups/%backup_name%' && echo '📁 Список бэкапов:' && ls -la backups/"
pause
goto :show_header

:ssh_connect
call :check_requirements
echo %GREEN%🔍 Подключение к серверу...%NC%
echo %YELLOW%Вы будете подключены к %REMOTE_HOST%%NC%
echo %YELLOW%Для выхода используйте команду 'exit'%NC%
echo.
ssh %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_DIR% && bash"
goto :show_header

:invalid_choice
echo %RED%❌ Неверный выбор. Попробуйте снова.%NC%
pause
goto :show_header

:exit
echo %GREEN%👋 До свидания!%NC%
pause
exit /b 0