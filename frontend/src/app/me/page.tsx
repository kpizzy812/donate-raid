// frontend/src/app/me/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { User as UserIcon, Mail, CreditCard, LogOut, Package, History, Settings } from 'lucide-react'

type Order = {
  id: number
  game?: { id: number; name: string } | null
  product?: { id: number; name: string } | null
  amount: number | string
  status: string
  created_at: string
}

export default function MePage() {
  const { user, logout, loading: userLoading } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/login')
      return
    }

    if (user) {
      fetchOrders()
    }
  }, [user, userLoading, router])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setOrders(data.slice(0, 5)) // Показываем только последние 5 заказов
      }
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'text-green-600 bg-green-100 dark:bg-green-900'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900'
      case 'cancelled':
      case 'canceled':
        return 'text-red-600 bg-red-100 dark:bg-red-900'
      case 'paid':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900'
      case 'processing':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'Завершён'
      case 'pending':
        return 'Ожидает'
      case 'cancelled':
      case 'canceled':
        return 'Отменён'
      case 'paid':
        return 'Оплачен'
      case 'processing':
        return 'В обработке'
      default:
        return status
    }
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-500">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="py-8 max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Основной контент */}
        <div className="lg:col-span-2 space-y-6">
          {/* Профиль пользователя */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
                <UserIcon size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {user.username || 'Пользователь'}
                </h1>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <LogOut size={16} />
                Выйти
              </button>
            </div>
          </div>

          {/* Последние заказы */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <History size={24} className="text-zinc-600 dark:text-zinc-400" />
                <h2 className="text-xl font-semibold">Последние заказы</h2>
              </div>
              <a
                href="/orders"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Все заказы →
              </a>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-zinc-500">Загрузка заказов...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400">У вас пока нет заказов</p>
                <a
                  href="/"
                  className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition text-sm"
                >
                  Перейти в каталог
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-750 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">#{order.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                        {order.game?.name || 'Неизвестная игра'} • {order.product?.name || 'Неизвестный товар'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold">{parseFloat(String(order.amount || 0)).toFixed(2)} ₽</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Баланс */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard size={24} />
              <h3 className="text-lg font-semibold">Баланс</h3>
            </div>
            <div className="text-3xl font-bold mb-2">
              {parseFloat(String(user.balance || 0)).toFixed(2)} ₽
            </div>
            <p className="text-blue-100 text-sm mb-4">
              Доступно для покупок
            </p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition text-sm font-medium">
              Пополнить баланс
            </button>
          </div>

          {/* Быстрые действия */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} />
              Быстрые действия
            </h3>
            <div className="space-y-3">
              <a
                href="/orders"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <History size={20} className="text-zinc-500" />
                <span>Все заказы</span>
              </a>
              <a
                href="/manual-request"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <Package size={20} className="text-zinc-500" />
                <span>Ручная заявка</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}