# 🪟 CLI Инструменты для Windows

Адаптированные версии Deploy Manager и Local Manager для Windows пользователей.

## 🛠️ Предварительные требования

### Обязательно:
1. **Git for Windows** (включает SSH, SCP, Bash)
   - Скачать: https://git-scm.com/download/win
   - При установке выбрать "Git Bash" и "OpenSSH"

2. **Docker Desktop** (для локальной разработки)
   - Скачать: https://www.docker.com/products/docker-desktop

### Опционально:
3. **Node.js** (для разработки без Docker)
   - Скачать: https://nodejs.org/
   - Выбрать LTS версию

4. **Python** (для разработки без Docker)
   - Скачать: https://www.python.org/
   - При установке отметить "Add to PATH"

## 📁 Файлы для Windows

Создайте в корне проекта:

### 1. `deploy-manager.bat` - Управление сервером
```batch
:: Скопируйте код из артефакта deploy_manager_bat
```

### 2. `local-manager.bat` - Локальная разработка
```batch
:: Скопируйте код из артефакта local_manager_bat
```

### 3. `dm.bat` - Короткий алиас для Deploy Manager
```batch
@echo off
call deploy-manager.bat %*
```

### 4. `lm.bat` - Короткий алиас для Local Manager
```batch
@echo off
call local-manager.bat %*
```

## 🚀 Быстрая установка

### Вариант 1: Command Prompt / PowerShell
1. **Скачайте файлы** в корень проекта
2. **Откройте Command Prompt** в папке проекта
3. **Запустите:** `deploy-manager.bat` или `dm.bat`

### Вариант 2: Git Bash (рекомендуется)
1. **Правый клик** в папке проекта → "Git Bash Here"
2. **Используйте Linux версии:**
   ```bash
   chmod +x *.sh
   ./deploy-manager.sh  # или ./dm.sh
   ./local-manager.sh   # или ./lm.sh
   ```

### Вариант 3: WSL (для продвинутых)
```bash
# В WSL используйте оригинальные .sh файлы
./setup-manager.sh
```

## 💻 Использование

### Deploy Manager (удаленный сервер):
```cmd
# Запуск полного интерфейса
deploy-manager.bat
# или короткий алиас
dm.bat

# Быстрые команды
dm.bat 1    # Полный деплой
dm.bat 2    # Быстрая синхронизация
dm.bat 9    # Просмотр логов
```

### Local Manager (локальная разработка):
```cmd
# Запуск полного интерфейса
local-manager.bat
# или короткий алиас
lm.bat

# Быстрые команды
lm.bat 1    # Docker запуск
lm.bat 7    # Backend разработка
lm.bat 9    # Frontend разработка
```

## 🔧 Настройка SSH для Windows

### Через Git Bash:
```bash
# Генерация SSH ключа
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Копирование на сервер
ssh-copy-id root@194.169.160.101

# Или вручную:
cat ~/.ssh/id_rsa.pub
# Скопировать и вставить в ~/.ssh/authorized_keys на сервере
```

### Через PowerShell:
```powershell
# Генерация ключа
ssh-keygen -t rsa -b 4096

# Копирование публичного ключа
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub | Set-Clipboard
```

## 🎯 Особенности Windows версии

### ✅ Что работает:
- Все основные функции деплоя
- Управление удаленными контейнерами
- Локальная разработка в Docker
- SSH подключения
- Просмотр логов

### ⚠️ Ограничения:
- **Rsync**: Нужен Git for Windows или используется SCP
- **Цвета**: Могут не работать в старых версиях cmd
- **Пути**: Используются Windows пути (`\` вместо `/`)

### 💡 Рекомендации:
1. **Используйте Git Bash** - лучшая совместимость
2. **Windows Terminal** - современный терминал с поддержкой цветов
3. **PowerShell 7** - хорошая альтернатива cmd

## 🔍 Устранение проблем

### SSH не работает:
```cmd
# Проверка SSH
where ssh
# Если не найден - установите Git for Windows

# Тест подключения
ssh root@194.169.160.101
```

### Docker не запускается:
```cmd
# Проверка Docker
docker --version
# Если не найден - установите Docker Desktop

# Запуск Docker Desktop из меню Пуск
```

### Кодировка в cmd:
```cmd
# Установка UTF-8
chcp 65001
```

### Python/Node не найден:
```cmd
# Проверка установки
python --version
node --version

# Добавление в PATH через Панель управления → Система → Переменные среды
```

## 📊 Сравнение вариантов для Windows

| Способ | Простота | Функциональность | Совместимость |
|--------|----------|------------------|---------------|
| **Command Prompt** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Git Bash** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **PowerShell** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **WSL** | ⭐ | ⭐⭐⭐ | ⭐⭐ |

## 🆘 Частые ошибки

### "ssh не является внутренней командой"
**Решение:** Установите Git for Windows или OpenSSH

### "docker не найден"
**Решение:** Установите Docker Desktop и перезапустите терминал

### "Отказано в доступе" при SSH
**Решение:** Проверьте SSH ключи и права доступа

### Кракозябры вместо эмодзи
**Решение:** Используйте Windows Terminal или Git Bash

## 📝 Примеры использования

### Полный деплой:
```cmd
C:\project> dm.bat
[Меню появится]
Ваш выбор: 1
🚀 Начинаем полный деплой...
```

### Локальная разработка:
```cmd
C:\project> lm.bat
[Меню появится]  
Ваш выбор: 1
🚀 Запуск в Docker...
✅ Контейнеры запущены!
🌐 Frontend: http://localhost:3001
```

### Быстрое подключение к серверу:
```cmd
C:\project> dm.bat
Ваш выбор: 13
🔍 Подключение к серверу...
[SSH сессия открывается]
```

---

💡 **Совет:** Для лучшего опыта используйте **Windows Terminal** + **Git Bash**