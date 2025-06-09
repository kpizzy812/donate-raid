# backend/Dockerfile
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Ставим системные зависимости (включая bash для вашего shebang)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      bash \
      gcc \
      libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Копируем зависимости и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код (включая start.sh) и создаём папку для логов
COPY . .
RUN mkdir -p /app/logs

# Делаем start.sh исполняемым
RUN chmod +x /app/start.sh

# Запуск через скрипт
CMD ["./start.sh"]
