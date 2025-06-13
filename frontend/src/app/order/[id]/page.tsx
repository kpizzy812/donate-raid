// frontend/src/app/order/[id]/page.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Smartphone, 
  Bitcoin, 
  DollarSign, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

interface PaymentInfo {
  order_id: number
  amount: number
  currency: string
  payment_method: string
  status: string
  payment_url?: string
  instructions?: string
  auto_process: boolean
}

interface Order {
  id: number
  amount: number
  currency: string
  status: string
  payment_method: string
  transaction_id?: string
  comment?: string
  created_at: string
  game?: { id: number; name: string }
  product?: { id: number; name: string; price_rub: number }
}

export default function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadOrder()
    loadPaymentInfo()
  }, [id])

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`)
      setOrder(response.data)
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error)
      toast.error('Заказ не найден')
      router.push('/me')
    }
  }

  const loadPaymentInfo = async () => {
    try {
      const response = await api.get(`/orders/${id}/payment-info`)
      setPaymentInfo(response.data)
    } catch (error) {
      console.error('Ошибка загрузки информации об оплате:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshOrder = async () => {
    setRefreshing(true)
    await loadOrder()
    await loadPaymentInfo()
    setRefreshing(false)
    toast.success('Информация о заказе обновлена')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Скопировано в буфер обмена')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
      case 'paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
      case 'processing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
      case 'canceled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает оплаты'
      case 'paid': return 'Оплачен'
      case 'processing': return 'В обработке'
      case 'done': return 'Выполнен'
      case 'canceled': return 'Отменен'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />
      case 'paid': return <CreditCard className="w-5 h-5" />
      case 'processing': return <RefreshCw className="w-5 h-5" />
      case 'done': return <CheckCircle className="w-5 h-5" />
      case 'canceled': return <XCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
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
      case 'sberbank': return 'Сбербанк Касса'
      case 'sbp': return 'СБП'
      case 'ton': return 'TON'
      case 'usdt': return 'USDT TON'
      case 'auto': return 'Автоматический'
      case 'manual': return 'Ручной'
      default: return method
    }
  }

  const parseUserData = (comment: string) => {
    try {
      // Пытаемся распарсить JSON из комментария
      const lines = comment.split('\n')
      const userData: Record<string, string> = {}
      
      for (const line of lines) {
        if (line.includes('[Товар') && line.includes(']')) {
          const jsonPart = line.substring(line.indexOf(']') + 1).trim()
          if (jsonPart.startsWith('{')) {
            const parsed = JSON.parse(jsonPart)
            Object.assign(userData, parsed)
          }
        }
      }
      
      return userData
    } catch {
      return {}
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Загрузка заказа...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-500">Заказ не найден</p>
      </div>
    )
  }

  const userData = order.comment ? parseUserData(order.comment) : {}

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6 px-4">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/me')}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Заказ #{order.id}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {new Date(order.created_at).toLocaleString('ru-RU')}
          </p>
        </div>
        <button
          onClick={refreshOrder}
          disabled={refreshing}
          className="ml-auto p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Статус заказа */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(order.status)}
              <div>
                <h2 className="text-lg font-semibold">Статус заказа</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            {/* Прогресс-бар */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Создан</span>
                <span>Оплачен</span>
                <span>В обработке</span>
                <span>Выполнен</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: order.status === 'pending' ? '25%' :
                           order.status === 'paid' ? '50%' :
                           order.status === 'processing' ? '75%' :
                           order.status === 'done' ? '100%' : '0%'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Детали заказа */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Детали заказа</h3>
            
            <div className="space-y-4">
              {order.game && (
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Игра:</span>
                  <span className="font-medium">{order.game.name}</span>
                </div>
              )}
              
              {order.product && (
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Товар:</span>
                  <span className="font-medium">{order.product.name}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Сумма:</span>
                <span className="font-bold text-lg text-green-600">
                  {order.amount} {order.currency}
                </span>
              </div>

              {order.transaction_id && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">ID транзакции:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{order.transaction_id}</span>
                    <button
                      onClick={() => copyToClipboard(order.transaction_id!)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Пользовательские данные */}
            {Object.keys(userData).length > 0 && (
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                <h4 className="font-medium mb-3">Данные для выполнения заказа:</h4>
                <div className="space-y-2">
                  {Object.entries(userData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Боковая панель - оплата */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Оплата</h3>
            
            <div className="flex items-center gap-3 mb-4">
              {getPaymentMethodIcon(order.payment_method)}
              <div>
                <div className="font-medium">{getPaymentMethodName(order.payment_method)}</div>
                <div className="text-sm text-zinc-500">
                  {order.amount} {order.currency}
                </div>
              </div>
            </div>

            {/* Информация об оплате для разных способов */}
            {paymentInfo && (
              <div className="space-y-4">
                {/* Банковская карта / СБП - автоматическая оплата */}
                {(order.payment_method === 'sberbank' || order.payment_method === 'sbp') && (
                  <>
                    {order.status === 'pending' && paymentInfo.payment_url && (
                      <a
                        href={paymentInfo.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Перейти к оплате
                      </a>
                    )}
                    
                    {paymentInfo.instructions && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        {paymentInfo.instructions}
                      </div>
                    )}
                  </>
                )}

                {/* Криптовалюта - ручная оплата */}
                {(order.payment_method === 'ton' || order.payment_method === 'usdt') && (
                  <>
                    {order.status === 'pending' && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Адрес для перевода:</div>
                        <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                          <code className="flex-1 text-xs font-mono">
                            {paymentInfo.payment_url || 'АДРЕС_КОШЕЛЬКА'}
                          </code>
                          <button
                            onClick={() => copyToClipboard(paymentInfo.payment_url || 'АДРЕС_КОШЕЛЬКА')}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="text-xs text-zinc-500 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                          <div className="font-medium mb-1">Важно:</div>
                          <ul className="space-y-1">
                            <li>• Переведите точную сумму</li>
                            <li>• Сохраните хеш транзакции</li>
                            <li>• Отправьте хеш в поддержку</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Инструкции */}
                {paymentInfo.instructions && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {paymentInfo.instructions}
                  </div>
                )}
              </div>
            )}

            {/* Поддержка */}
            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Нужна помощь?
              </div>
              <button
                onClick={() => router.push('/support')}
                className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-2 px-4 rounded-lg transition-colors"
              >
                Написать в поддержку
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}