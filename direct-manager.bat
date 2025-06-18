@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: local-manager.bat - Локальная разработка (Windows)
title Local Manager - DonateRaid Project

:: Цвета
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
echo %PURPLE%║%WHITE%                    💻 LOCAL MANAGER 💻                       %PURPLE%║%NC%
echo %PURPLE%║%CYAN%                  Локальная разработка                        %PURPLE%║%NC%
echo %PURPLE%║%YELLOW%                        Windows                              %PURPLE%║%NC%
echo %PURPLE%╚══════════════════════════════════════════════════════════════╝%NC%
echo.
goto :show_menu

:show_menu
echo %WHITE%Выберите действие:%NC%
echo.
echo %CYAN%🐳 DOCKER ЛОКАЛЬНО:%NC%
echo   %GREEN%1%NC% - 🚀 Запуск в Docker (docker-compose up)
echo   %GREEN%2%NC% - ⏹️  Остановка Docker контейнеров
echo   %GREEN%3%NC% - 🔄 Перезапуск Docker контейнеров
echo   %GREEN%4%NC% - 🏗️  Пересборка Docker контейнеров
echo   %GREEN%5%NC% - 📋 Статус Docker контейнеров
echo   %GREEN%6%NC% - 📜 Логи Docker контейнеров
echo.
echo %CYAN%⚡ РАЗРАБОТКА (без Docker):%NC%
echo   %GREEN%7%NC% - 🐍 Запуск Backend (FastAPI)
echo   %GREEN%8%NC% - 🤖 Запуск Telegram Bot
echo   %GREEN%9%NC% - ⚛️  Запуск Frontend (Next.js)
echo   %GREEN%10%NC% - 📊 Запуск PostgreSQL (Docker)
echo.
echo %CYAN%🗄️  БАЗА ДАННЫХ:%NC%
echo   %GREEN%11%NC% - 🔄 Применить миграции
echo   %GREEN%12%NC% - 📝 Создать миграцию
echo   %GREEN%13%NC% - 💾 Бэкап локальной БД
echo   %GREEN%14%NC% - 🗃️  Подключиться к БД (psql)
echo.
echo %CYAN%🛠️  УТИЛИТЫ:%NC%
echo   %GREEN%15%NC% - 📦 Установка зависимостей
echo   %GREEN%16%NC% - 🧹 Очистка (node_modules, __pycache__, .next)
echo   %GREEN%17%NC% - 🔍 Проверка портов
echo.
echo   %RED%0%NC% - ❌ Выход
echo.
set /p choice=%YELLOW%Ваш выбор [0-17]: %NC%

if "%choice%"=="1" goto :docker_up
if "%choice%"=="2" goto :docker_down
if "%choice%"=="3" goto :docker_restart
if "%choice%"=="4" goto :docker_rebuild
if "%choice%"=="5" goto :docker_status
if "%choice%"=="6" goto :docker_logs
if "%choice%"=="7" goto :dev_backend
if "%choice%"=="8" goto :dev_bot
if "%choice%"=="9" goto :dev_frontend
if "%choice%"=="10" goto :dev_database
if "%choice%"=="11" goto :db_migrate
if "%choice%"=="12" goto :db_create_migration
if "%choice%"=="13" goto :db_backup
if "%choice%"=="14" goto :db_connect
if "%choice%"=="15" goto :install_deps
if "%choice%"=="16" goto :cleanup
if "%choice%"=="17" goto :check_ports
if "%choice%"=="0" goto :exit
goto :invalid_choice

:check_docker
where docker >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Docker не найден! Установите Docker Desktop%NC%
    echo %CYAN%💡 Скачайте с: https://www.docker.com/products/docker-desktop%NC%
    pause
    goto :show_header
)
goto :eof

:check_node
where node >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Node.js не найден! Установите Node.js%NC%
    echo %CYAN%💡 Скачайте с: https://nodejs.org/%NC%
    pause
    goto :show_header
)
goto :eof

:check_python
where python >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Python не найден! Установите Python%NC%
    echo %CYAN%💡 Скачайте с: https://www.python.org/%NC%
    pause
    goto :show_header
)
goto :eof

:docker_up
call :check_docker
echo %GREEN%🚀 Запуск в Docker...%NC%
docker-compose up -d
echo %GREEN%✅ Контейнеры запущены!%NC%
echo %CYAN%🌐 Frontend: http://localhost:3001%NC%
echo %CYAN%🔌 API: http://localhost:8001%NC%
echo %CYAN%📚 API Docs: http://localhost:8001/docs%NC%
pause
goto :show_header

:docker_down
call :check_docker
echo %GREEN%⏹️ Остановка контейнеров...%NC%
docker-compose down
echo %GREEN%✅ Контейнеры остановлены!%NC%
pause
goto :show_header

:docker_restart
call :check_docker
echo %GREEN%🔄 Перезапуск контейнеров...%NC%
docker-compose restart
echo %GREEN%✅ Контейнеры перезапущены!%NC%
pause
goto :show_header

:docker_rebuild
call :check_docker
echo %GREEN%🏗️ Пересборка контейнеров...%NC%
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo %GREEN%✅ Пересборка завершена!%NC%
pause
goto :show_header

:docker_status
call :check_docker
echo %GREEN%📋 Статус контейнеров:%NC%
docker-compose ps
pause
goto :show_header

:docker_logs
call :check_docker
echo %GREEN%📜 Логи контейнеров:%NC%
docker-compose logs --tail=50
pause
goto :show_header

:dev_backend
call :check_python
echo %GREEN%🐍 Запуск Backend (FastAPI)...%NC%
echo %YELLOW%Порт: 8001%NC%
cd /d backend

if not exist ".venv" (
    echo %YELLOW%⚠️ Виртуальное окружение не найдено. Создаём...%NC%
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

echo %BLUE%🚀 Запускаем FastAPI...%NC%
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
cd /d ..
goto :show_header

:dev_bot
call :check_python
echo %GREEN%🤖 Запуск Telegram Bot...%NC%
cd /d backend

if not exist ".venv" (
    echo %RED%❌ Виртуальное окружение не найдено! Сначала запустите Backend.%NC%
    pause
    cd /d ..
    goto :show_header
)

call .venv\Scripts\activate.bat
echo %BLUE%🚀 Запускаем бота...%NC%
python bot\main.py
cd /d ..
goto :show_header

:dev_frontend
call :check_node
echo %GREEN%⚛️ Запуск Frontend (Next.js)...%NC%
echo %YELLOW%Порт: 3001%NC%
cd /d frontend

if not exist "node_modules" (
    echo %YELLOW%⚠️ node_modules не найден. Устанавливаем зависимости...%NC%
    npm install
)

echo %BLUE%🚀 Запускаем Next.js...%NC%
npm run dev
cd /d ..
goto :show_header

:dev_database
call :check_docker
echo %GREEN%📊 Запуск PostgreSQL в Docker...%NC%
docker-compose up -d postgres
echo %GREEN%✅ PostgreSQL запущен!%NC%
echo %CYAN%📡 Подключение: localhost:5432%NC%
pause
goto :show_header

:db_migrate
echo %GREEN%🔄 Применение миграций...%NC%
cd /d backend

if exist ".venv" (
    call .venv\Scripts\activate.bat
    alembic upgrade head
) else (
    echo %YELLOW%Используем Docker...%NC%
    docker-compose exec backend alembic upgrade head
)

echo %GREEN%✅ Миграции применены!%NC%
cd /d ..
pause
goto :show_header

:db_create_migration
echo %GREEN%📝 Создание новой миграции...%NC%
set /p description=%YELLOW%Введите описание миграции: %NC%
cd /d backend

if exist ".venv" (
    call .venv\Scripts\activate.bat
    alembic revision --autogenerate -m "%description%"
) else (
    echo %YELLOW%Используем Docker...%NC%
    docker-compose exec backend alembic revision --autogenerate -m "%description%"
)

echo %GREEN%✅ Миграция создана!%NC%
cd /d ..
pause
goto :show_header

:db_backup
call :check_docker
echo %GREEN%💾 Бэкап локальной БД...%NC%
for /f "tokens=2 delims==" %%I in ('wmic OS Get localdatetime /value') do set "dt=%%I"
set "backup_name=local_backup_%dt:~0,8%_%dt:~8,6%.sql"

if not exist "backups" mkdir backups
docker-compose exec -T postgres pg_dump -U postgres donateraid > "backups\%backup_name%"
echo %GREEN%✅ Бэкап создан: backups\%backup_name%%NC%
pause
goto :show_header

:db_connect
call :check_docker
echo %GREEN%🗃️ Подключение к БД...%NC%
docker-compose exec postgres psql -U postgres -d donateraid
goto :show_header

:install_deps
echo %GREEN%📦 Установка зависимостей...%NC%

echo %BLUE%🐍 Backend зависимости...%NC%
cd /d backend
if not exist ".venv" (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -r requirements.txt
cd /d ..

echo %BLUE%⚛️ Frontend зависимости...%NC%
cd /d frontend
call npm install
cd /d ..

echo %GREEN%✅ Все зависимости установлены!%NC%
pause
goto :show_header

:cleanup
echo %GREEN%🧹 Очистка проекта...%NC%

echo %BLUE%🗑️ Удаляем node_modules...%NC%
for /d /r . %%d in (node_modules) do @if exist "%%d" rd /s /q "%%d" 2>nul

echo %BLUE%🗑️ Удаляем __pycache__...%NC%
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d" 2>nul

echo %BLUE%🗑️ Удаляем .next...%NC%
if exist "frontend\.next" rd /s /q "frontend\.next" 2>nul

echo %BLUE%🗑️ Удаляем .pyc файлы...%NC%
del /s /q *.pyc 2>nul

echo %GREEN%✅ Очистка завершена!%NC%
pause
goto :show_header

:check_ports
echo %GREEN%🔍 Проверка портов...%NC%
echo.

echo %CYAN%Порт 3001 (Frontend):%NC%
netstat -an | findstr :3001 >nul
if errorlevel 1 (
    echo %GREEN%✅ Порт 3001 свободен%NC%
) else (
    echo %RED%❌ Порт 3001 занят%NC%
    netstat -ano | findstr :3001
)

echo.
echo %CYAN%Порт 8001 (Backend):%NC%
netstat -an | findstr :8001 >nul
if errorlevel 1 (
    echo %GREEN%✅ Порт 8001 свободен%NC%
) else (
    echo %RED%❌ Порт 8001 занят%NC%
    netstat -ano | findstr :8001
)

echo.
echo %CYAN%Порт 5432 (PostgreSQL):%NC%
netstat -an | findstr :5432 >nul
if errorlevel 1 (
    echo %GREEN%✅ Порт 5432 свободен%NC%
) else (
    echo %RED%❌ Порт 5432 занят%NC%
    netstat -ano | findstr :5432
)

pause
goto :show_header

:invalid_choice
echo %RED%❌ Неверный выбор. Попробуйте снова.%NC%
pause
goto :show_header

:exit
echo %GREEN%👋 До свидания!%NC%
pause
exit /b 0