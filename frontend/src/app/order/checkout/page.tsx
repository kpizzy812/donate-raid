// frontend/src/app/order/checkout/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'
import {
  CreditCard,
  Smartphone,
  Bitcoin,
  DollarSign,
  ArrowLeft,
  ShoppingCart,
  User,
  Mail,
  Lock
} from 'lucide-react'

// Определяем тип для способа оплаты
type PaymentMethod = 'sberbank' | 'sbp' | 'ton' | 'usdt'

interface PaymentTerm {
  id: number
  title: string
  content: string
  required: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([])
  const [acceptedTerms, setAcceptedTerms] = useState<{ [key: number]: boolean }>({})
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Поля для гостевого заказа
  const [guestEmail, setGuestEmail] = useState('')
  const [guestName, setGuestName] = useState('')

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
  }, [])

  // Загружаем условия оплаты
  useEffect(() => {
    const loadPaymentTerms = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-terms`)
        if (res.ok) {
          const terms = await res.json()
          setPaymentTerms(terms)

          // Инициализируем состояние принятых условий
          const initialAccepted: { [key: number]: boolean } = {}
          terms.forEach((term: PaymentTerm) => {
            initialAccepted[term.id] = false
          })
          setAcceptedTerms(initialAccepted)
        }
      } catch (err) {
        console.error('Ошибка загрузки условий оплаты:', err)
      }
    }

    loadPaymentTerms()
  }, [])

  const validateTerms = () => {
    const requiredTerms = paymentTerms.filter(term => term.required)
    for (const term of requiredTerms) {
      if (!acceptedTerms[term.id]) {
        toast.error(`Необходимо принять условие: ${term.title}`)
        return false
      }
    }
    return true
  }

  const validateGuestData = () => {
    if (!isAuthenticated) {
      if (!guestEmail) {
        toast.error('Введите email для получения информации о заказе')
        return false
      }

      // Простая валидация email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(guestEmail)) {
        toast.error('Введите корректный email адрес')
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

    if (!validateGuestData()) {
      return
    }

    if (items.length === 0) return

    setLoading(true)

    try {
      let endpoint = ''
      let headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      }

      let body: any = {
        items: items.map((item) => ({
          game_id: item.product.game_id,
          product_id: item.product.id,
          amount: item.product.price_rub,
          currency: 'RUB',
          payment_method: method,
          comment: JSON.stringify(item.inputs),
        }))
      }

      if (isAuthenticated) {
        // Авторизованный пользователь - используем старый endpoint
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/orders/bulk`
        headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`
      } else {
        // Гость - используем новый endpoint
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/orders/guest/bulk`
        body.guest_email = guestEmail
        body.guest_name = guestName || null
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Ошибка при создании заказа')
      }

      const data = await res.json()
      const orderId = data.id

      toast.success('Заказ успешно создан!')
      clearCart()

      // Для RoboKassa методов сразу редиректим на оплату
      if (data.payment_url && (method === 'sberbank' || method === 'sbp')) {
        window.location.href = data.payment_url
      } else {
        // Для криптовалют и ручных методов - на страницу заказа
        router.push(`/order/${orderId}`)
      }

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
        <ShoppingCart className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Добавьте товары в корзину для оформления заказа
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Перейти к покупкам
        </button>
      </div>
    )
  }

  const totalAmount = items.reduce((sum, item) => sum + item.product.price_rub, 0)

  return (
    <div className="py-8 max-w-4xl mx-auto px-4">
      {/* Шапка */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold">Оформление заказа</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Основная форма */}
        <div className="lg:col-span-2 space-y-6">

          {/* Статус авторизации */}
          {isAuthenticated !== null && (
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Информация о покупателе</h2>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Lock className="w-4 h-4" />
                  <span>Вы авторизованы</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                    Для оформления заказа как гость, укажите email для получения информации о заказе
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Имя (необязательно)
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                        placeholder="Ваше имя"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 <strong>Совет:</strong> Зарегистрируйтесь для более удобного управления заказами и получения бонусов!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Способы оплаты */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h2 className="text-lg font-semibold mb-4">Способ оплаты</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['sberbank', 'sbp', 'ton', 'usdt'] as PaymentMethod[]).map((paymentMethod) => (
                <button
                  key={paymentMethod}
                  onClick={() => setMethod(paymentMethod)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    method === paymentMethod
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getPaymentMethodIcon(paymentMethod)}
                    <span className="font-medium">{getPaymentMethodName(paymentMethod)}</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {getPaymentMethodDescription(paymentMethod)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Условия оплаты */}
          {paymentTerms.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold mb-4">Условия</h2>

              <div className="space-y-4">
                {paymentTerms.map((term) => (
                  <div key={term.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`term-${term.id}`}
                      checked={acceptedTerms[term.id] || false}
                      onChange={() => handleTermToggle(term.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`term-${term.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {term.title}
                        {term.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div
                        className="text-sm text-zinc-600 dark:text-zinc-400 mt-1"
                        dangerouslySetInnerHTML={{ __html: term.content }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Сайдбар с итогами */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Ваш заказ</h2>

            <div className="space-y-3 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div className="flex-1 pr-2">
                    <div className="font-medium">{item.product.name}</div>
                  </div>
                  <div className="font-medium">
                    {item.product.price_rub} ₽
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mb-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Итого:</span>
                <span>{totalAmount} ₽</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !method}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Создание заказа...' : 'Оформить заказ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}