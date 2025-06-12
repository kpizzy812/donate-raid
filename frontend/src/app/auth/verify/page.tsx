// frontend/src/app/auth/verify/page.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError('Отсутствует токен авторизации в ссылке')
        setStatus('error')
        return
      }

      try {
        setStatus('verifying')
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 сек таймаут
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify?token=${token}`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const data = await res.json()

        if (!res.ok || !data.token) {
          throw new Error(data.detail || 'Ошибка верификации токена')
        }

        // Сохраняем токен
        localStorage.setItem('access_token', data.token)
        setStatus('success')
        
        // Редирект через 1 секунду для показа успеха
        setTimeout(() => {
          router.replace('/')
        }, 1000)
        
      } catch (err: any) {
        console.error('Verification error:', err)
        
        if (err.name === 'AbortError') {
          setError('Превышено время ожидания. Попробуйте перейти по ссылке снова.')
        } else {
          setError(err.message || 'Не удалось авторизоваться. Возможно, ссылка устарела.')
        }
        setStatus('error')
      }
    }

    verify()
  }, [token, router])

  if (status === 'verifying') {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
        <h1 className="text-xl font-semibold mb-2">Выполняем вход...</h1>
        <p className="text-zinc-500">Проверяем ваши данные</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-green-600 mb-2">Успешно!</h1>
        <p className="text-zinc-500">Перенаправляем на главную страницу...</p>
      </div>
    )
  }

  return (
    <div className="py-20 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-red-600 mb-4">Ошибка входа</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
      
      <div className="space-y-3">
        <a
          href="/login"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
        >
          Попробовать снова
        </a>
        <a
          href="/support"
          className="block w-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-4 py-2 rounded-md transition"
        >
          Связаться с поддержкой
        </a>
      </div>
    </div>
  )
}