// frontend/src/components/GlobalChatProvider.tsx - УЛУЧШЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Bell } from 'lucide-react'
import SupportChat from './SupportChat'
import { api } from '@/lib/api'
import { v4 as uuidv4 } from 'uuid'

interface Notification {
  type: string
  title: string
  message: string
  created_at: string
  read: boolean
  data?: any
}

export default function GlobalChatProvider() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [guestId, setGuestId] = useState<string>('')

  // Получаем или создаем guest_id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let gid = localStorage.getItem('guest_id')
      if (!gid) {
        gid = uuidv4()
        localStorage.setItem('guest_id', gid)
      }
      setGuestId(gid)
    }
  }, [])

  // Загружаем уведомления
  const loadNotifications = async () => {
    try {
      const params = guestId ? `?guest_id=${guestId}` : ''
      const response = await api.get(`/notifications${params}`)
      setNotifications(response.data || [])
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error)
    }
  }

  // Загружаем количество уведомлений
  const loadNotificationCount = async () => {
    try {
      const params = guestId ? `?guest_id=${guestId}` : ''
      const response = await api.get(`/notifications/count${params}`)
      setNotificationCount(response.data?.count || 0)
    } catch (error) {
      console.error('Ошибка загрузки счетчика уведомлений:', error)
    }
  }

  // Периодически проверяем уведомления
  useEffect(() => {
    if (!guestId) return

    loadNotifications()
    loadNotificationCount()

    const interval = setInterval(() => {
      loadNotificationCount()
    }, 30000) // Проверяем каждые 30 секунд

    return () => clearInterval(interval)
  }, [guestId])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return 'только что'
    if (diffMinutes < 60) return `${diffMinutes} мин назад`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} ч назад`
    return date.toLocaleDateString('ru-RU')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'support_reply':
        return '💬'
      case 'order_update':
        return '📦'
      default:
        return '🔔'
    }
  }

  return (
    <>
      {/* Кнопки управления */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999]">

          {/* Кнопка уведомлений */}
          {notificationCount > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) {
                    loadNotifications()
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all group hover:scale-110 relative"
                title="Уведомления"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Выпадающий список уведомлений */}
              {showNotifications && (
                <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Уведомления</h3>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Нет новых уведомлений</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification, index) => (
                        <div
                          key={index}
                          className="p-4 border-b border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer"
                          onClick={() => {
                            if (notification.type === 'support_reply') {
                              setIsChatOpen(true)
                              setShowNotifications(false)
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                {notification.title}
                              </p>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                {notification.message}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Кнопка чата */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all group hover:scale-110 relative"
            title="Открыть чат поддержки"
          >
            <MessageCircle className="w-6 h-6" />

            {/* Пульсирующий эффект */}
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75"></div>

            {/* Индикатор новых сообщений */}
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>
      )}

      {/* Оверлей и чат */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          {/* Контейнер чата */}
          <div className="relative w-full max-w-2xl h-[600px] max-h-[90vh]">
            {/* Кнопка закрытия */}
            <button
              onClick={() => {
                setIsChatOpen(false)
                // Обновляем счетчик при закрытии чата
                loadNotificationCount()
              }}
              className="absolute -top-12 right-0 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 p-2 rounded-full shadow-lg transition-all z-10"
              title="Закрыть чат"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Сам чат */}
            <div className="w-full h-full">
              <SupportChat />
            </div>
          </div>
        </div>
      )}

      {/* Клик вне области уведомлений для закрытия */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  )
}