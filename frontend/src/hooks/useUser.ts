// frontend/src/hooks/useUser.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useEffect, useState } from 'react'

export type User = {
  id: number
  email?: string
  username?: string
  role: string
  balance: number
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('unauthorized')

      const data = await res.json()
      setUser(data)
    } catch (err) {
      localStorage.removeItem('access_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    window.location.href = '/login'
  }

  useEffect(() => {
    fetchUser()

    // Слушаем изменения в localStorage для автообновления хедера
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue) {
          // Токен добавлен - загружаем пользователя
          fetchUser()
        } else {
          // Токен удален - сбрасываем пользователя
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Также слушаем кастомное событие для мгновенного обновления
    const handleUserUpdate = () => {
      fetchUser()
    }

    window.addEventListener('userUpdated', handleUserUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userUpdated', handleUserUpdate)
    }
  }, [])

  return {
    user,
    isAuth: !!user,
    loading,
    logout,
    refetch: fetchUser,
  }
}