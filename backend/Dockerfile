# Используем официальный минимальный образ Python
FROM python:3.11-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Устанавливаем системные зависимости (для psycopg2 и т.д.)
RUN apt-get update && apt-get install -y gcc libpq-dev && apt-get clean

# Копируем зависимости и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем ВСЁ из backend: код, alembic.ini, alembic/, .env и т.д.
COPY . .

# Создание папки логов на этапе сборки
RUN mkdir -p /app/logs

# Запуск через скрипт
COPY start.sh .
RUN chmod +x start.sh
CMD ["./start.sh"]

