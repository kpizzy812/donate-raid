// frontend/next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  // output: 'standalone', // Временно отключаем для упрощения

  // Принудительно используем IPv4
  env: {
    NODE_OPTIONS: '--dns-result-order=ipv4first',
  },

  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  async rewrites() {
    // Используем разные destination в зависимости от окружения
    const apiDestination = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8001/api/:path*'  // Для разработки используем localhost
      : 'http://backend:8000/api/:path*';   // Для продакшна используем Docker network

    return [
      {
        source: '/api/:path*',
        destination: apiDestination,
      },
    ];
  },

  reactStrictMode: true,

  // Добавляем обработку изображений
  images: {
    domains: ['localhost', 'backend'],
    unoptimized: true, // Отключаем оптимизацию изображений для простоты
  },

  // Настройки для исправления проблем с fetch в SSR
  experimental: {
    serverComponentsExternalPackages: [],
  },
};