# deploy-manager.ps1 - Управление удаленным сервером (PowerShell)
param(
    [string]$Action = ""
)

# Настройки
$REMOTE_USER = "root"
$REMOTE_HOST = "194.169.160.101"
$REMOTE_DIR = "/home/donate"

# Функция для вывода цветного текста
function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Show-Header {
    Clear-Host
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                    🚀 DEPLOY MANAGER 🚀                      ║" -ForegroundColor Magenta
    Write-Host "║                     DonateRaid Project                       ║" -ForegroundColor Magenta
    Write-Host "║                       PowerShell                             ║" -ForegroundColor Magenta
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
}

function Show-Menu {
    Write-ColorText "Выберите действие:" "White"
    Write-Host ""
    Write-ColorText "📦 ДЕПЛОЙ И СИНХРОНИЗАЦИЯ:" "Cyan"
    Write-ColorText "  1 - 🚀 Полный деплой (rsync + build + migrate + restart)" "Green"
    Write-ColorText "  2 - 📁 Быстрая синхронизация кода (только rsync)" "Green"
    Write-ColorText "  3 - 🔧 Настройка сервера (server-setup.sh)" "Green"
    Write-Host ""
    Write-ColorText "🐳 УПРАВЛЕНИЕ КОНТЕЙНЕРАМИ:" "Cyan"
    Write-ColorText "  4 - ▶️  Запуск всех контейнеров" "Green"
    Write-ColorText "  5 - ⏹️  Остановка всех контейнеров" "Green"
    Write-ColorText "  6 - 🔄 Перезапуск всех контейнеров" "Green"
    Write-ColorText "  7 - 🏗️  Пересборка контейнеров" "Green"
    Write-Host ""
    Write-ColorText "📊 МОНИТОРИНГ:" "Cyan"
    Write-ColorText "  8 - 📋 Статус контейнеров" "Green"
    Write-ColorText "  9 - 📜 Просмотр логов всех контейнеров" "Green"
    Write-ColorText "  10 - 📈 Живые логи (follow)" "Green"
    Write-Host ""
    Write-ColorText "🛠️ РАЗРАБОТКА:" "Cyan"
    Write-ColorText "  11 - 🐍 Применить миграции БД" "Green"
    Write-ColorText "  12 - 💾 Бэкап базы данных" "Green"
    Write-ColorText "  13 - 🔍 SSH подключение к серверу" "Green"
    Write-Host ""
    Write-ColorText "  0 - ❌ Выход" "Red"
    Write-Host ""
}

function Test-Requirements {
    # Проверяем SSH
    if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
        Write-ColorText "❌ SSH не найден! Установите OpenSSH или Git for Windows" "Red"
        Write-ColorText "💡 Или используйте WSL" "Yellow"
        Read-Host "Нажмите Enter для продолжения"
        return $false
    }

    # Проверяем SCP
    if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
        Write-ColorText "❌ SCP не найден! Установите OpenSSH" "Red"
        Read-Host "Нажмите Enter для продолжения"
        return $false
    }

    return $true
}

function Confirm-Action {
    param([string]$Message)

    Write-ColorText "⚠️  $Message" "Yellow"
    $response = Read-Host "Продолжить? [y/N]"

    if ($response -eq "y" -or $response -eq "yes" -or $response -eq "Y") {
        return $true
    }

    Write-ColorText "❌ Отменено" "Red"
    return $false
}

function Invoke-FullDeploy {
    if (-not (Test-Requirements)) { return }

    Write-ColorText "🚀 Начинаем полный деплой..." "Green"

    if (-not (Confirm-Action "Будет выполнен полный деплой на $REMOTE_HOST")) {
        return
    }

    Write-ColorText "📂 Синхронизация файлов..." "Blue"

    # Используем scp или rsync если доступен
    if (Get-Command rsync -ErrorAction SilentlyContinue) {
        & rsync -az --delete --exclude=".git/" --exclude="node_modules/" --exclude="*.pyc" --exclude="__pycache__/" --exclude=".next/" --exclude="backend/logs/" --exclude="backend/.venv/" ./ "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_DIR/"
    } else {
        Write-ColorText "⚠️ Rsync не найден, используем scp..." "Yellow"
        & scp -r . "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_DIR/"
    }

    Write-ColorText "🔧 Выполняем деплой на сервере..." "Blue"

    $deployScript = @"
cd $REMOTE_DIR
set -euo pipefail
echo "🔧 Проверка окружения..."
if ! command -v docker >/dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi
if [ ! -f .env ]; then
    echo "⚠️ Создание .env..."
    cp .env.example .env
    sed -i "s|localhost:8001|$REMOTE_HOST:8001|g" .env
fi
echo "🛑 Останавливаю контейнеры..."
docker-compose down --remove-orphans || true
echo "🔨 Собираю контейнеры..."
docker-compose build --no-cache
echo "🚀 Запускаю контейнеры..."
docker-compose up -d --force-recreate
echo "⏳ Ждем PostgreSQL..."
sleep 10
echo "🗄️ Применение миграций..."
docker-compose exec -T backend alembic upgrade head || true
echo "📊 Статус:"
docker-compose ps
echo "✅ Деплой завершён!"
"@

    & ssh "$REMOTE_USER@$REMOTE_HOST" $deployScript

    Write-ColorText "🎉 Полный деплой успешно завершен!" "Green"
    Write-ColorText "🌐 Фронтенд: http://$REMOTE_HOST`:3001" "Cyan"
    Write-ColorText "🔌 API: http://$REMOTE_HOST`:8001" "Cyan"
}

function Invoke-QuickSync {
    if (-not (Test-Requirements)) { return }

    Write-ColorText "📁 Быстрая синхронизация кода..." "Green"

    if (Get-Command rsync -ErrorAction SilentlyContinue) {
        & rsync -az --exclude=".git/" --exclude="node_modules/" --exclude="*.pyc" --exclude="__pycache__/" --exclude=".next/" --exclude="backend/logs/" --exclude="backend/.venv/" ./ "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_DIR/"
    } else {
        & scp -r . "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_DIR/"
    }

    Write-ColorText "✅ Синхронизация завершена!" "Green"
    Write-ColorText "💡 Для применения изменений может потребоваться перезапуск контейнеров" "Yellow"
}

function Invoke-SetupServer {
    if (-not (Test-Requirements)) { return }

    Write-ColorText "🔧 Настройка сервера..." "Green"

    if (-not (Confirm-Action "Будет выполнена настройка сервера $REMOTE_HOST")) {
        return
    }

    if (-not (Test-Path "server-setup.sh")) {
        Write-ColorText "❌ Файл server-setup.sh не найден!" "Red"
        return
    }

    Write-ColorText "📤 Копируем скрипт настройки..." "Blue"
    & scp server-setup.sh "$REMOTE_USER@$REMOTE_HOST`:/tmp/"

    Write-ColorText "🔧 Запускаем настройку сервера..." "Blue"
    & ssh "$REMOTE_USER@$REMOTE_HOST" "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"

    Write-ColorText "✅ Настройка сервера завершена!" "Green"
}

function Invoke-ContainerAction {
    param([string]$Action, [string]$Description)

    if (-not (Test-Requirements)) { return }

    Write-ColorText $Description "Green"
    & ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose $Action"

    if ($Action -eq "up -d") {
        Write-ColorText "✅ Контейнеры запущены!" "Green"
        Show-ContainerStatus
    } elseif ($Action -eq "down") {
        Write-ColorText "✅ Контейнеры остановлены!" "Green"
    } elseif ($Action -eq "restart") {
        Write-ColorText "✅ Контейнеры перезапущены!" "Green"
        Show-ContainerStatus
    }
}

function Show-ContainerStatus {
    Write-ColorText "📋 Статус контейнеров:" "Green"
    & ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose ps"
}

function Show-Logs {
    if (-not (Test-Requirements)) { return }

    Write-ColorText "📜 Логи всех контейнеров:" "Green"
    Write-ColorText "(последние 50 строк для каждого контейнера)" "Yellow"
    Write-Host ""
    & ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose logs --tail=50"
}

function Show-LiveLogs {
    if (-not (Test-Requirements)) { return }

    Write-ColorText "📈 Живые логи (Ctrl+C для выхода):" "Green"
    Write-Host ""
    & ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose logs -f"
}

function Invoke-Migrations {
    if (-not (Test-Requirements)) { return }

    Write-ColorText "🐍 Применение миграций БД..." "Green"

    $migrationScript = @"
cd $REMOTE_DIR
echo "🗄️ Текущее состояние миграций:"
docker-compose exec -T backend alembic current || true
echo ""
echo "🔄 Применяем миграции..."
docker-compose exec -T backend alembic upgrade head
echo "✅ Миграции применены!"
"@

    & ssh "$REMOTE_USER@$REMOTE_HOST" $migrationScript
}

function Invoke-DatabaseBackup {
    if (-not (Test-Requirements)) { return }

    Write-ColorText "💾 Создание бэкапа базы данных..." "Green"

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupName = "backup_$timestamp.sql"

    $backupScript = @"
cd $REMOTE_DIR
echo "💾 Создаём бэкап: $backupName"
mkdir -p backups
docker-compose exec -T postgres pg_dump -U postgres donateraid > "backups/$backupName"
echo "✅ Бэкап создан: backups/$backupName"
echo "📁 Список бэкапов:"
ls -la backups/
"@

    & ssh "$REMOTE_USER@$REMOTE_HOST" $backupScript
}

function Invoke-SSHConnect {
    if (-not (Test-Requirements)) { return }

    Write-ColorText "🔍 Подключение к серверу..." "Green"
    Write-ColorText "Вы будете подключены к $REMOTE_HOST" "Yellow"
    Write-ColorText "Для выхода используйте команду 'exit'" "Yellow"
    Write-Host ""

    & ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && bash"
}

# Главная функция
function Start-DeployManager {
    # Если передан параметр, выполняем действие напрямую
    if ($Action -ne "") {
        switch ($Action) {
            "1" { Invoke-FullDeploy; return }
            "2" { Invoke-QuickSync; return }
            "3" { Invoke-SetupServer; return }
            "4" { Invoke-ContainerAction "up -d" "▶️ Запуск всех контейнеров..."; return }
            "5" {
                if (Confirm-Action "Все контейнеры будут остановлены") {
                    Invoke-ContainerAction "down" "⏹️ Остановка всех контейнеров..."
                }
                return
            }
            "6" { Invoke-ContainerAction "restart" "🔄 Перезапуск всех контейнеров..."; return }
            "8" { Show-ContainerStatus; return }
            "9" { Show-Logs; return }
            "10" { Show-LiveLogs; return }
            "11" { Invoke-Migrations; return }
            "12" { Invoke-DatabaseBackup; return }
            "13" { Invoke-SSHConnect; return }
            default { Write-ColorText "❌ Неверное действие: $Action" "Red"; return }
        }
    }

    # Интерактивное меню
    while ($true) {
        Show-Header
        Show-Menu

        $choice = Read-Host "Ваш выбор [0-13]"

        switch ($choice) {
            "1" { Invoke-FullDeploy }
            "2" { Invoke-QuickSync }
            "3" { Invoke-SetupServer }
            "4" { Invoke-ContainerAction "up -d" "▶️ Запуск всех контейнеров..." }
            "5" {
                if (Confirm-Action "Все контейнеры будут остановлены") {
                    Invoke-ContainerAction "down" "⏹️ Остановка всех контейнеров..."
                }
            }
            "6" { Invoke-ContainerAction "restart" "🔄 Перезапуск всех контейнеров..." }
            "7" {
                if (Confirm-Action "Контейнеры будут пересобраны (может занять время)") {
                    Write-ColorText "🏗️ Пересборка контейнеров..." "Green"
                    & ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose down && docker-compose build --no-cache && docker-compose up -d"
                    Write-ColorText "✅ Пересборка завершена!" "Green"
                    Show-ContainerStatus
                }
            }
            "8" { Show-ContainerStatus }
            "9" { Show-Logs }
            "10" { Show-LiveLogs }
            "11" { Invoke-Migrations }
            "12" { Invoke-DatabaseBackup }
            "13" { Invoke-SSHConnect }
            "0" {
                Write-ColorText "👋 До свидания!" "Green"
                return
            }
            default {
                Write-ColorText "❌ Неверный выбор. Попробуйте снова." "Red"
            }
        }

        if ($choice -ne "10" -and $choice -ne "13" -and $choice -ne "0") {
            Read-Host "`nНажмите Enter для продолжения"
        }
    }
}

# Проверяем, что мы в корне проекта
if (-not (Test-Path "docker-compose.yml")) {
    Write-ColorText "❌ Ошибка: docker-compose.yml не найден!" "Red"
    Write-ColorText "Убедитесь, что вы находитесь в корне проекта." "Yellow"
    exit 1
}

# Запускаем
Start-DeployManager