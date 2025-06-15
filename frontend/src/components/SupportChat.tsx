// frontend/src/components/SupportChat.tsx - УЛУЧШЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Clock, CheckCircle, Bell } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface SupportMessage {
  id: number
  message: string
  is_from_user: boolean
  created_at: string
  status?: string
}

interface SupportChatProps {
  className?: string
}

export default function SupportChat({ className = '' }: SupportChatProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPresets, setShowPresets] = useState(true)
  const [chatInitialized, setChatInitialized] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [guestId, setGuestId] = useState<string>('')
  const [hasNewAdminMessages, setHasNewAdminMessages] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const presetOptions = [
    'Проблема с заказом 😕',
    'Проблема с оплатой 💳',
    'Нужен возврат 🔙',
    'Проблема/вопрос по сайту 🌐',
    'Сотрудничество 🤝',
    'Другой вопрос ❓'
  ]

  const workingHours = {
    start: "09:00",
    end: "21:00",
    timezone: "МСК"
  }

  // Получаем или создаем guest_id и token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('access_token')
      setToken(t)

      let gid = localStorage.getItem('guest_id')
      if (!gid) {
        gid = uuidv4()
        localStorage.setItem('guest_id', gid)
      }
      setGuestId(gid)
    }
  }, [])

  useEffect(() => {
    if (!chatInitialized && guestId) {
      loadMessages()
      setChatInitialized(true)
    }
  }, [chatInitialized, guestId])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Автообновление сообщений каждые 3 секунды
  useEffect(() => {
    if (!chatInitialized || !guestId) return

    const interval = setInterval(() => {
      loadMessagesQuietly()
    }, 3000)

    return () => clearInterval(interval)
  }, [chatInitialized, guestId])

  // Проверяем новые сообщения от админов
  useEffect(() => {
    const newAdminMessages = messages.filter(msg =>
      !msg.is_from_user &&
      new Date(msg.created_at).getTime() > Date.now() - 10000 // За последние 10 секунд
    )

    if (newAdminMessages.length > 0 && messages.length > lastMessageCount) {
      setHasNewAdminMessages(true)

      // Показываем уведомление
      if (Notification.permission === 'granted') {
        new Notification('Новый ответ от поддержки', {
          body: newAdminMessages[0].message.slice(0, 100),
          icon: '/favicon.ico'
        })
      }

      // Автоматически убираем индикатор через 5 секунд
      setTimeout(() => setHasNewAdminMessages(false), 5000)
    }

    setLastMessageCount(messages.length)
  }, [messages])

  // Запрашиваем разрешение на уведомления
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Тихая загрузка сообщений для автообновления
  const loadMessagesQuietly = async () => {
    if (!guestId) return

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/support/my?guest_id=${guestId}`
      const headers: Record<string, string> = {}

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })

      if (response.ok) {
        const data = await response.json()
        const newMessages = Array.isArray(data) ? data : []

        // Обновляем только если есть новые сообщения
        if (newMessages.length !== messages.length) {
          setMessages(newMessages)
        }
      }
    } catch (error) {
      console.error('Ошибка при тихой загрузке сообщений:', error)
    }
  }

  const loadMessages = async () => {
    if (!guestId) return

    setLoading(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/support/my?guest_id=${guestId}`
      const headers: Record<string, string> = {}

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })

      if (response.ok) {
        const data = await response.json()
        const newMessages = Array.isArray(data) ? data : []
        setMessages(newMessages)

        if (newMessages.length > 0) {
          setShowPresets(false)
        }
      } else {
        console.error('Ошибка загрузки сообщений:', response.status)
      }
    } catch (error) {
      console.error('Ошибка при загрузке сообщений:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (messageText = message) => {
    if (!messageText.trim() || !guestId) return

    const trimmedMessage = messageText.trim()
    setLoading(true)
    setMessage('')

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/support/send`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: trimmedMessage,
          guest_id: guestId
        })
      })

      if (response.ok) {
        await loadMessages()
        setShowPresets(false)
        setHasNewAdminMessages(false) // Сбрасываем индикатор новых сообщений
      } else {
        console.error('Ошибка отправки сообщения:', response.status)
        setMessage(trimmedMessage) // Возвращаем сообщение обратно при ошибке
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error)
      setMessage(trimmedMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return 'только что'
    if (diffMinutes < 60) return `${diffMinutes} мин назад`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} ч назад`
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isWorkingHours = () => {
    const now = new Date()
    const currentHour = now.getHours()
    return currentHour >= 9 && currentHour < 21
  }

  return (
    <div className={`bg-white dark:bg-zinc-800 rounded-lg shadow-lg ${className}`}
         style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>

      {/* Заголовок */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Поддержка
            {hasNewAdminMessages && (
              <span className="flex items-center gap-1 text-green-600">
                <Bell className="w-4 h-4 animate-pulse" />
                <span className="text-xs">Новый ответ!</span>
              </span>
            )}
          </h3>
          <div className={`text-xs px-2 py-1 rounded-full ${isWorkingHours()
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {isWorkingHours() ? '🟢 Онлайн' : '🟡 Вне часов работы'}
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Часы работы: {workingHours.start} - {workingHours.end} {workingHours.timezone}
        </p>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showPresets ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
              Выберите тему обращения или напишите свой вопрос:
            </p>
            <div className="grid gap-2">
              {presetOptions.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(preset)}
                  disabled={loading}
                  className="text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        ) : loading && messages.length === 0 ? (
          <div className="text-center text-zinc-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p>Загрузка...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-zinc-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Начните диалог с поддержкой</p>
            <p className="text-xs">Мы обычно отвечаем в течение 5 минут</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.is_from_user
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-l-4 border-green-500'
                }`}
              >
                <div>{msg.message}</div>
                <div className={`text-xs mt-1 flex items-center gap-1 ${
                  msg.is_from_user ? 'text-blue-200' : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  {!msg.is_from_user && <span className="font-medium">👨‍💼 Поддержка</span>}
                  <span>{formatTime(msg.created_at)}</span>
                  {msg.is_from_user && msg.status === 'in_progress' && (
                    <CheckCircle className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                sendMessage()
              }
            }}
            placeholder="Напишите ваше сообщение..."
            className="flex-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!message.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white p-2 rounded transition-colors flex items-center justify-center"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {!isWorkingHours() && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Сейчас вне рабочих часов. Ответим утром!
          </p>
        )}
      </div>
    </div>
  )
}