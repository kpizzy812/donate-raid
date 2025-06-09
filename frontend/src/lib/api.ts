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
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})