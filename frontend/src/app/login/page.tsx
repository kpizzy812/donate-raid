'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!email.includes('@')) return setError('Некорректный email')
    try {
      setLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Ошибка при отправке')
      }

      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-10 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Вход через Email</h1>

      {sent ? (
        <p className="text-center text-green-600">Письмо с ссылкой на авторизацию отправлено. Проверьте почту.</p>
      ) : (
        <>
          <input
            type="email"
            placeholder="Ваш email"
            className="w-full px-4 py-2 rounded-md border bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {loading ? 'Отправка...' : 'Получить ссылку'}
          </button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </>
      )}
    </div>
  )
}
