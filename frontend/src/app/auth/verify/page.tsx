'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const verify = async () => {
      if (!token) return setError('Нет токена в ссылке')
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify?token=${token}`)
        const data = await res.json()

        if (!res.ok || !data.token) throw new Error('Ошибка верификации')

        localStorage.setItem('access_token', data.token)
        router.replace('/')
      } catch (err) {
        setError('Не удалось авторизоваться. Попробуйте снова.')
      }
    }

    verify()
  }, [token])

  return (
    <div className="py-10 text-center">
      <h1 className="text-2xl font-bold">Вход...</h1>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}
