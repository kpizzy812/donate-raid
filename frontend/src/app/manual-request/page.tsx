// frontend/src/app/manual-request/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ArrowLeft, CheckCircle, Clock, X } from 'lucide-react'

export default function ManualRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [orderData, setOrderData] = useState<any>(null)
  const [formData, setFormData] = useState({
    manual_game_name: '',
    amount: '',
    currency: 'RUB',
    comment: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!formData.manual_game_name.trim()) {
    setError('Укажите название игры')
    return
  }

  if (!formData.amount || parseFloat(formData.amount) <= 0) {
    setError('Укажите корректную сумму')
    return
  }

  setLoading(true)
  setError('')

  try {
    const response = await api.post('/orders/manual', {
      manual_game_name: formData.manual_game_name.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      comment: formData.comment.trim() || null,
      payment_method: 'manual'
      // 🆕 УБРАЛИ game_id и product_id - backend автоматически их создаст
    })

    setOrderData(response.data)
    setSubmitted(true)
  } catch (err: any) {
    console.error('Ошибка при создании заявки:', err)

    // Улучшенная обработка ошибок
    let errorMessage = 'Ошибка при отправке заявки'

    if (err.response?.data) {
      if (typeof err.response.data === 'string') {
        errorMessage = err.response.data
      } else if (err.response.data.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail
        } else if (Array.isArray(err.response.data.detail)) {
          // Обработка ошибок валидации Pydantic
          const validationErrors = err.response.data.detail
            .map((error: any) => `${error.loc?.join('.') || 'поле'}: ${error.msg}`)
            .join(', ')
          errorMessage = `Ошибки валидации: ${validationErrors}`
        }
      } else if (err.response.data.message) {
        errorMessage = err.response.data.message
      }
    }

    setError(errorMessage)
  } finally {
    setLoading(false)
  }
}

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // Очищаем ошибку при изменении
  }

  if (submitted && orderData) {
    return (
      <div className="py-6 space-y-6 max-w-xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                Заявка отправлена!
              </h2>
              <p className="text-sm text-green-700 dark:text-green-300">
                Заявка #{orderData.id} успешно создана
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="bg-white dark:bg-green-900/30 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Детали заявки:
              </h3>
              <div className="space-y-1 text-green-700 dark:text-green-300">
                <p><span className="font-medium">Игра:</span> {formData.manual_game_name}</p>
                <p><span className="font-medium">Сумма:</span> {formData.amount} {formData.currency}</p>
                {formData.comment && (
                  <p><span className="font-medium">Комментарий:</span> {formData.comment}</p>
                )}
                <p><span className="font-medium">Статус:</span>
                  <span className="inline-flex items-center gap-1 ml-1">
                    <Clock className="w-3 h-3" />
                    Ожидает обработки
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Что дальше?
              </h4>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Наш оператор рассмотрит заявку в течение 1-24 часов</li>
                <li>• Вы получите уведомление о статусе заявки</li>
                <li>• При необходимости мы свяжемся с вами для уточнений</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.push('/me')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Мои заказы
            </button>
            <button
              onClick={() => {
                setSubmitted(false)
                setOrderData(null)
                setFormData({
                  manual_game_name: '',
                  amount: '',
                  currency: 'RUB',
                  comment: ''
                })
              }}
              className="px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
            >
              Новая заявка
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6 max-w-xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <div>
        <h1 className="text-2xl font-bold mb-2">Заявка на донат в свою игру</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Если вашей игры нет в списке — вы можете оформить заявку вручную.
          Укажите, что именно вы хотите купить, и оператор свяжется с вами.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200 font-medium">Ошибка</p>
          </div>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Название игры *
          </label>
          <input
            type="text"
            value={formData.manual_game_name}
            onChange={(e) => handleInputChange('manual_game_name', e.target.value)}
            placeholder="Например: Mobile Legends, PUBG Mobile, Genshin Impact"
            className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Сумма *
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="100"
              className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Валюта
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="RUB">₽ RUB</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Комментарий
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => handleInputChange('comment', e.target.value)}
            placeholder="Опишите подробнее, что вы хотите купить в игре: какую валюту, предметы, услуги и т.д."
            rows={4}
            className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          />
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⏰ Время обработки
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Ручные заявки обрабатываются от 5 минут до 24 часов в зависимости от сложности заказа.
            Мы свяжемся с вами для уточнения деталей при необходимости.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Отправляем заявку...
            </>
          ) : (
            'Отправить заявку'
          )}
        </button>
      </form>
    </div>
  )
}