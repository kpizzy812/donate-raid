# Используем Node.js 18 Alpine
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Копируем остальные файлы
COPY . .

EXPOSE 3000

# Используем dev-режим
CMD ["npm", "run", "dev"]
