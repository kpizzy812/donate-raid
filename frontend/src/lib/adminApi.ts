// frontend/src/lib/adminApi.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import axios from 'axios'

// Создаем axios инстанс для админских запросов
export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Добавляем интерцептор для автоматического добавления токена
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Функция для создания игры
export async function createGame(data: {
  name: string
  banner_url?: string
  instructions?: string
  auto_support?: boolean
  sort_order?: number
}) {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('Не авторизован')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка при создании игры')
  }

  return res.json();
}

// Функция для обновления игры
export async function updateGame(id: number, data: {
  name?: string
  banner_url?: string
  instructions?: string
  auto_support?: boolean
  sort_order?: number
}) {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('Не авторизован')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка при обновлении игры')
  }

  return res.json();
}

// Функция для удаления игры
export async function deleteGame(id: number) {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('Не авторизован')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка при удалении игры')
  }

  return res.json();
}

// Функция для получения списка игр
export async function getGames() {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('Не авторизован')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка при получении игр')
  }

  return res.json();
}

// Функция для получения игры по ID
export async function getGame(id: number) {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('Не авторизован')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка при получении игры')
  }

  return res.json();
}