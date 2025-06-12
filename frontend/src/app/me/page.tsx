// frontend/src/app/me/page.tsx - УЛУЧШЕННАЯ ВЕРСИЯ
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { User as UserIcon, Mail, CreditCard, LogOut, Package, History, Settings } from 'lucide-react'

type Order = {
  id: number
  game: string
  product: string
  amount: number
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my`, {
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
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900'
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900'
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершен'
      case 'pending': return 'В обработке'
      case 'cancelled': return 'Отменен'
      default: return status
    }
  }

  if (userLoading || loading) {
    return (
      <div className="py-10 max-w-4xl mx-auto px-4 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-zinc-500">Загружаем данные...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="py-6 max-w-4xl mx-auto px-4 pb-20 md:pb-6">
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Заголовок */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserIcon size={32} className="text-blue-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Личный кабинет</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Управляйте своим аккаунтом и заказами</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Информация о пользователе */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <UserIcon size={20} />
              Информация о профиле
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <Mail size={20} className="text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              {user.username && (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <UserIcon size={20} className="text-zinc-500" />
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Имя пользователя</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <Settings size={20} className="text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">ID пользователя</p>
                  <p className="font-medium">#{user.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Последние заказы */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <History size={20} />
                Последние заказы
              </h2>
              <a 
                href="/orders" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Все заказы →
              </a>
            </div>

            {orders.length === 0 ? (
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
                        {order.game} • {order.product}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold">{order.amount.toFixed(2)} ₽</p>
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
              {user.balance.toFixed(2)} ₽
            </div>
            <p className="text-blue-100 text-sm mb-4">
              Доступно для покупок
            </p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition text-sm font-medium">
              Пополнить баланс
            </button>
          </div>

          {/* Быстрые действия */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Быстрые действия</h3>
            <div className="space-y-3">
              <a 
                href="/orders" 
                className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <Package size={20} className="text-zinc-500" />
                <span className="text-sm">Мои заказы</span>
              </a>
              <a 
                href="/support" 
                className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <Mail size={20} className="text-zinc-500" />
                <span className="text-sm">Поддержка</span>
              </a>
              <button 
                onClick={logout}
                className="flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition w-full text-left text-red-600 dark:text-red-400"
              >
                <LogOut size={20} />
                <span className="text-sm">Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}