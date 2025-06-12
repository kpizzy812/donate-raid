// frontend/src/app/login/page.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  // Редирект если уже авторизован
  useEffect(() => {
    if (!userLoading && user) {
      router.replace('/')
    }
  }, [user, userLoading, router])

  // Countdown для повторной отправки
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.includes('@')) {
      setError('Введите корректный email')
      return
    }

    if (loading) return

    try {
      setLoading(true)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 сек таймаут
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Ошибка при отправке')
      }

      setSent(true)
      setCountdown(60) // 60 секунд до повторной отправки
      
      // Автоматическая проверка входящих токенов каждые 3 секунды
      const checkInterval = setInterval(async () => {
        const token = localStorage.getItem('access_token')
        if (token) {
          clearInterval(checkInterval)
          router.replace('/')
        }
      }, 3000)

      // Останавливаем проверку через 5 минут
      setTimeout(() => clearInterval(checkInterval), 300000)

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Превышено время ожидания. Попробуйте снова.')
      } else {
        setError(err.message || 'Произошла ошибка')
      }
    } finally {
      setLoading(false)
    }
  }

  const resendEmail = () => {
    setSent(false)
    setCountdown(0)
    submit({ preventDefault: () => {} } as React.FormEvent)
  }

  if (userLoading) {
    return (
      <div className="py-10 max-w-md mx-auto text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-zinc-500">Проверяем авторизацию...</p>
      </div>
    )
  }

  return (
    <div className="py-10 max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Вход в DonateRaid</h1>
        <p className="text-zinc-500 mt-2">Быстрый вход через email без пароля</p>
      </div>

      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">Письмо отправлено!</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Проверьте почту <strong>{email}</strong> и перейдите по ссылке для входа
            </p>
            <div className="text-sm text-zinc-500 space-y-2">
              <p>• Ссылка действительна 30 минут</p>
              <p>• Проверьте папку "Спам", если письма нет</p>
              <p>• Страница автоматически обновится при входе</p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
            {countdown > 0 ? (
              <p className="text-sm text-zinc-500">
                Отправить повторно через {countdown} сек.
              </p>
            ) : (
              <button
                onClick={resendEmail}
                className="text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Отправить письмо повторно
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email адрес
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-md border bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Отправляем...
              </>
            ) : (
              'Получить ссылку для входа'
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="text-xs text-zinc-500 text-center space-y-1">
            <p>Нажимая кнопку, вы соглашаетесь с</p>
            <div className="space-x-2">
              <a href="/privacy" className="text-blue-600 hover:underline">Политикой конфиденциальности</a>
              <span>и</span>
              <a href="/terms" className="text-blue-600 hover:underline">Условиями использования</a>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}