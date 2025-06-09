'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: number
  email: string
  balance: number
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return router.replace('/login')

    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          throw new Error('Ошибка авторизации')
        }

        const data = await res.json()
        setUser(data)
      } catch (err: any) {
        console.error(err)
        setError('Не удалось загрузить данные пользователя')
        router.replace('/login')
      }
    }

    fetchUser()
  }, [])

  return (
    <div className="py-10 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Личный кабинет</h1>

      {error && <p className="text-center text-red-500">{error}</p>}

      {user && (
        <div className="space-y-3 text-center">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Баланс:</strong> {user.balance.toFixed(2)} ₽</p>

          <button
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            onClick={() => {
              localStorage.removeItem('access_token')
              router.push('/login')
            }}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}
