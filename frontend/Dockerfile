# frontend/Dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

# Все остальные файлы будут подгружаться через volume (см. docker-compose)
COPY . .

EXPOSE 3000

# Используем dev-режим (с hot reload)
CMD ["npm", "run", "dev"]
