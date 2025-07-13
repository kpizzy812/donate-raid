import axios from 'axios'

export async function fetchGames(query = '') {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function fetchGameById(id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${id}`)
  if (!res.ok) throw new Error('Game not found')
  return res.json()
}

export async function fetchOrderById(id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch order')
  return res.json()
}

export function getTokenHeader() {
  const token = localStorage.getItem('access_token') // Исправлено: было 'token', теперь 'access_token'
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Исправлен интерцептор - везде используем 'access_token'
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function fetchReviews(params?: {
  rating?: number
  game_name?: string
  limit?: number
  offset?: number
}) {
  const searchParams = new URLSearchParams()

  if (params?.rating) searchParams.append('rating', params.rating.toString())
  if (params?.game_name) searchParams.append('game_name', params.game_name)
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.offset) searchParams.append('offset', params.offset.toString())

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch reviews')
  return res.json()
}

export async function fetchReviewsStats() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/stats`)
  if (!res.ok) throw new Error('Failed to fetch reviews stats')
  return res.json()
}

export async function createReview(data: {
  order_id: number
  rating: number
  text: string
  email?: string
  is_anonymous?: boolean
}) {
  const token = localStorage.getItem('access_token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Ошибка создания отзыва' }))
    throw new Error(error.detail || 'Ошибка создания отзыва')
  }

  return res.json()
}

export async function checkCanReview(orderId: number) {
  const token = localStorage.getItem('access_token')
  const headers: HeadersInit = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/can-review/${orderId}`, {
    headers
  })

  if (!res.ok) throw new Error('Failed to check review availability')
  return res.json()
}

export async function getReviewByOrder(orderId: number) {
  const token = localStorage.getItem('access_token')
  const headers: HeadersInit = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/order/${orderId}`, {
    headers
  })

  if (!res.ok && res.status !== 404) {
    throw new Error('Failed to fetch review')
  }

  if (res.status === 404) {
    return null
  }

  return res.json()
}