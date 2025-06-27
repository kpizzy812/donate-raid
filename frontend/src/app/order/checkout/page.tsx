'use client'

import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CreditCard, Smartphone, Bitcoin, DollarSign, Trash2, ArrowLeft, Lock } from 'lucide-react'

interface PaymentTerm {
  id: number
  title: string
  description?: string
  is_required: boolean
  is_active: boolean
  sort_order: number
}

export default function CheckoutPage() {
  const { items, clearCart, removeItem } = useCart()
  const router = useRouter()
  const [method, setMethod] = useState<'sberbank' | 'sbp' | 'ton' | 'usdt' | null>(null)
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([])
  const [acceptedTerms, setAcceptedTerms] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)

  const total = items.reduce((sum, item) => sum + Number(item.product.price_rub), 0)

  useEffect(() => {
    if (items.length === 0) {
      router.push('/')
      return
    }
    loadPaymentTerms()
  }, [items, router])

  const loadPaymentTerms = async () => {
    try {
      const response = await api.get('/api/payment-terms/')
      setPaymentTerms(response.data)

      // Инициализируем состояние чекбоксов
      const initialTerms: Record<number, boolean> = {}
      response.data.forEach((term: PaymentTerm) => {
        initialTerms[term.id] = false
      })
      setAcceptedTerms(initialTerms)
    } catch (error) {
      console.error('Ошибка загрузки соглашений:', error)
      // Создаем базовые соглашения если не загрузились
      const defaultTerms = [
        {
          id: 1,
          title: "Вы подтверждаете, что ввели верные данные и выбрали верный регион",
          description: "Проверьте правильность введенных данных перед оплатой",
          is_required: true,
          is_active: true,
          sort_order: 1
        },
        {
          id: 2,
          title: "Вы ознакомлены с Политикой обработки персональных данных",
          description: "Согласие на обработку персональных данных согласно ФЗ-152",
          is_required: true,
          is_active: true,
          sort_order: 2
        }
      ]
      setPaymentTerms(defaultTerms)
      setAcceptedTerms({ 1: false, 2: false })
    }
  }

  const validateTerms = (): boolean => {
    for (const term of paymentTerms) {
      if (term.is_required && !acceptedTerms[term.id]) {
        toast.error(`Необходимо согласиться с условием: "${term.title}"`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!method) {
      toast.error('Выберите способ оплаты')
      return
    }

    if (!validateTerms()) {
      return
    }

    if (items.length === 0) return

    setLoading(true)

    try {
      // Используем bulk endpoint для создания заказа из корзины
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            game_id: item.product.game_id,
            product_id: item.product.id,
            amount: item.product.price_rub,
            currency: 'RUB',
            payment_method: method,
            comment: JSON.stringify(item.inputs),
          }))
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Ошибка при создании заказа')
      }

      const data = await res.json()
      const orderId = data.id

      toast.success('Заказ успешно создан!')

      // Очищаем корзину и переходим к заказу
      clearCart()
      router.push(`/order/${orderId}`)

    } catch (err: any) {
      toast.error(err.message || 'Ошибка при создании заказа')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTermToggle = (termId: number) => {
    setAcceptedTerms(prev => ({
      ...prev,
      [termId]: !prev[termId]
    }))
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'sberbank': return <CreditCard className="w-6 h-6 text-green-600" />
      case 'sbp': return <Smartphone className="w-6 h-6 text-blue-600" />
      case 'ton': return <Bitcoin className="w-6 h-6 text-blue-500" />
      case 'usdt': return <DollarSign className="w-6 h-6 text-green-500" />
      default: return <CreditCard className="w-6 h-6" />
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'sberbank': return 'Банковская карта'
      case 'sbp': return 'СБП'
      case 'ton': return 'TON'
      case 'usdt': return 'USDT TON'
      default: return method
    }
  }

  const getPaymentMethodDescription = (method: string) => {
    switch (method) {
      case 'sberbank': return 'Visa, MasterCard, МИР'
      case 'sbp': return 'Система быстрых платежей'
      case 'ton': return 'Ручная оплата криптовалютой'
      case 'usdt': return 'Ручная оплата стейблкоином'
      default: return ''
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-8 max-w-3xl mx-auto text-center px-4">
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Добавьте товары в корзину для оформления заказа
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Перейти в каталог
        </button>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-8 px-4">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Оформление заказа</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Основная область - товары и оплата */}
        <div className="lg:col-span-2 space-y-6">
          {/* Товары в заказе */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ваш заказ ({items.length})</h2>
              <button
                onClick={() => router.push('/order/cart')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Редактировать
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{item.product.name}</h3>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      ₽{item.product.price_rub}
                    </div>

                    {/* Пользовательские данные */}
                    {Object.keys(item.inputs).length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-xs text-zinc-500 font-medium mb-1">Данные заказа:</div>
                        {Object.entries(item.inputs).map(([key, value]) => (
                          <div key={key} className="text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeItem(i)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Способы оплаты */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold mb-4">💳 Способ оплаты</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'sberbank', name: 'Банковская карта', desc: 'Visa, MasterCard, МИР' },
                { key: 'sbp', name: 'СБП', desc: 'Система быстрых платежей' },
                { key: 'ton', name: 'TON', desc: 'Оплата криптовалютой' },
                { key: 'usdt', name: 'USDT TON', desc: 'Оплата стейблкоином' },
              ].map((pm) => (
                <button
                  key={pm.key}
                  onClick={() => setMethod(pm.key as any)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    method === pm.key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(pm.key)}
                    <div>
                      <div className="font-medium">{pm.name}</div>
                      <div className="text-sm text-zinc-500">{pm.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Пользовательские соглашения */}
          {paymentTerms.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-4">📋 Условия и соглашения</h2>
              <div className="space-y-4">
                {paymentTerms.map((term) => (
                  <label key={term.id} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms[term.id] || false}
                      onChange={() => handleTermToggle(term.id)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {term.title}
                        {term.is_required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      {term.description && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          {term.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}

                {/* Дополнительная информация с ссылками на правовые документы */}
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Совершая покупку, вы соглашаетесь с{' '}
                    <Link href="/legal/terms" target="_blank" className="text-blue-600 hover:underline">
                      пользовательским соглашением
                    </Link>
                    ,{' '}
                    <Link href="/legal/privacy" target="_blank" className="text-blue-600 hover:underline">
                      политикой конфиденциальности
                    </Link>
                    {' '}и{' '}
                    <Link href="/legal/offer" target="_blank" className="text-blue-600 hover:underline">
                      публичной офертой
                    </Link>
                    . В случае возврата средства зачисляются на баланс аккаунта согласно{' '}
                    <Link href="/legal/refund" target="_blank" className="text-blue-600 hover:underline">
                      политике возврата
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Боковая панель - итоги */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Итого</h3>

            {/* Детализация */}
            <div className="space-y-2 mb-4">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{item.product.name}</span>
                  <span>₽{item.product.price_rub}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Итого:</span>
                <span>₽{total}</span>
              </div>
            </div>

            {/* Кнопка оплаты */}
            <button
              onClick={handleSubmit}
              disabled={loading || !method}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Обработка...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Оплатить ₽{total}
                </>
              )}
            </button>

            {/* Дополнительная информация */}
            <div className="mt-4 text-xs text-zinc-500 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Безопасная оплата</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Быстрая обработка</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Поддержка 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}