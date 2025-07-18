#!/bin/bash
# server-setup.sh - Полная настройка сервера с nginx + SSL
set -euo pipefail

echo "🚀 Настройка сервера для DonateRaid..."

# Обновляем систему
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Устанавливаем Docker
echo "🐳 Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Добавляем пользователя в группу docker
    usermod -aG docker $USER

    # Устанавливаем Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker уже установлен"
fi

# Создаем директорию проекта
echo "📁 Создание директории проекта..."
mkdir -p /home/donate
cd /home/donate

# Устанавливаем дополнительные утилиты
echo "🔧 Установка дополнительных утилит..."
apt install -y htop nano curl wget git rsync

# === НОВОЕ: Установка и настройка nginx ===
echo "🌐 Установка nginx..."
apt install -y nginx

# Останавливаем nginx для настройки
systemctl stop nginx

# === НОВОЕ: Установка certbot для SSL ===
echo "🔒 Установка certbot для SSL сертификатов..."
apt install -y certbot python3-certbot-nginx

# === НОВОЕ: Создание конфигурации nginx ===
echo "⚙️ Создание конфигурации nginx..."
cat > /etc/nginx/sites-available/donateraid.ru << 'EOF'
# nginx.conf для reverse proxy
server {
    listen 80;
    server_name donateraid.ru www.donateraid.ru;

    # Временно разрешаем HTTP для получения SSL сертификата
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect HTTP to HTTPS (активируется после получения SSL)
    # return 301 https://$server_name$request_uri;
}

# server {
#     listen 443 ssl http2;
#     server_name donateraid.ru www.donateraid.ru;
#
#     # SSL configuration (будет добавлено certbot автоматически)
#     # ssl_certificate /etc/letsencrypt/live/donateraid.ru/fullchain.pem;
#     # ssl_certificate_key /etc/letsencrypt/live/donateraid.ru/privkey.pem;
#
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
#     ssl_prefer_server_ciphers off;
#
#     # API (FastAPI) - добавляем слеш для избежания 307 редиректов
#     location /api/ {
#         proxy_pass http://localhost:8001/api/;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 86400;
#
#         # CORS заголовки
#         add_header Access-Control-Allow-Origin *;
#         add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
#         add_header Access-Control-Allow-Headers "Authorization, Content-Type";
#
#         # Обработка OPTIONS запросов
#         if ($request_method = 'OPTIONS') {
#             add_header Access-Control-Allow-Origin *;
#             add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
#             add_header Access-Control-Allow-Headers "Authorization, Content-Type";
#             add_header Access-Control-Max-Age 1728000;
#             add_header Content-Type 'text/plain charset=UTF-8';
#             add_header Content-Length 0;
#             return 204;
#         }
#     }
#
#     # WebSocket для support чата
#     location /ws/ {
#         proxy_pass http://localhost:8001/ws/;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection "upgrade";
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_read_timeout 86400;
#         proxy_send_timeout 86400;
#     }
#
#     # Static files (uploads)
#     location /uploads/ {
#         proxy_pass http://localhost:8001/uploads/;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#
#         # Кеширование статических файлов
#         expires 1y;
#         add_header Cache-Control "public, immutable";
#     }
#
#     # Frontend (Next.js) - обрабатывается последним
#     location / {
#         proxy_pass http://localhost:3001;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#     }
#
#     # Gzip compression
#     gzip on;
#     gzip_vary on;
#     gzip_min_length 1024;
#     gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
#
#     # Security headers
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header Referrer-Policy "no-referrer-when-downgrade" always;
#     add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
# }
EOF

# Активируем сайт
ln -sf /etc/nginx/sites-available/donateraid.ru /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию nginx
echo "🔍 Проверка конфигурации nginx..."
nginx -t

# Запускаем nginx
echo "▶️ Запуск nginx..."
systemctl start nginx
systemctl enable nginx

# === НОВОЕ: Получение SSL сертификата ===
echo "🔒 Получение SSL сертификата от Let's Encrypt..."
echo "⚠️ Убедитесь, что DNS записи для donateraid.ru указывают на этот сервер!"
read -p "Нажмите Enter для продолжения получения SSL сертификата..."

# Получаем сертификат
if certbot --nginx -d donateraid.ru -d www.donateraid.ru --agree-tos --no-eff-email --email admin@donateraid.ru; then
    echo "✅ SSL сертификат успешно получен!"

    # Обновляем конфигурацию nginx для использования HTTPS
    echo "🔄 Обновление конфигурации nginx для HTTPS..."
    cat > /etc/nginx/sites-available/donateraid.ru << 'EOF'
# nginx.conf для reverse proxy - ФИНАЛЬНАЯ ВЕРСИЯ
server {
    listen 80;
    server_name donateraid.ru www.donateraid.ru;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name donateraid.ru www.donateraid.ru;

    # SSL configuration (управляется certbot)
    ssl_certificate /etc/letsencrypt/live/donateraid.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/donateraid.ru/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # API (FastAPI) - добавляем слеш для избежания 307 редиректов
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;

        # CORS заголовки
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";

        # Обработка OPTIONS запросов
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # WebSocket для support чата
    location /ws/ {
        proxy_pass http://localhost:8001/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static files (uploads)
    location /uploads/ {
        proxy_pass http://localhost:8001/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Кеширование статических файлов
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend (Next.js) - обрабатывается последним
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

    # Перезагружаем nginx
    nginx -t && systemctl reload nginx

else
    echo "❌ Не удалось получить SSL сертификат. Проверьте DNS записи."
    echo "💡 Вы можете повторить попытку позже командой:"
    echo "   certbot --nginx -d donateraid.ru -d www.donateraid.ru"
fi

# === НОВОЕ: Настройка автообновления SSL сертификатов ===
echo "🔄 Настройка автообновления SSL сертификатов..."
cat > /etc/cron.d/certbot-renew << 'EOF'
# Автообновление SSL сертификатов каждый день в 2:30
30 2 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

# Даем права на выполнение
chmod 644 /etc/cron.d/certbot-renew

echo "✅ Полная настройка сервера завершена!"
echo ""
echo "🎯 Что настроено:"
echo "  ✅ Docker и Docker Compose"
echo "  ✅ Nginx как reverse proxy"
echo "  ✅ SSL сертификаты Let's Encrypt"
echo "  ✅ Автообновление сертификатов"
echo "  ✅ Все необходимые утилиты"
echo ""
echo "🌐 Ваш сайт: https://donateraid.ru"
echo "🔗 Теперь можно запустить деплой с локальной машины:"
echo "   ./deploy-manager.sh -> 1) Полный деплой"