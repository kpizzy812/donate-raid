// frontend/src/components/SupportChat.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, Clock } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface SupportMessage {
  id: number
  message: string
  is_from_user: boolean
  created_at: string
}

interface SupportChatProps {
  className?: string
}

export default function SupportChat({ className = '' }: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPresets, setShowPresets] = useState(true)
  const [chatInitialized, setChatInitialized] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [guestId, setGuestId] = useState<string>('')
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
    if (isOpen && !chatInitialized && guestId) {
      loadMessages()
      setChatInitialized(true)
    }
  }, [isOpen, chatInitialized, guestId])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const loadMessages = async () => {
    if (!guestId) return

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/support/my?guest_id=${guestId}`
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(Array.isArray(data) ? data : [])
        if (data.length > 0) {
          setShowPresets(false)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !guestId) return

    setLoading(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/support/message?guest_id=${guestId}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: text.trim()
        })
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages(prev => [...prev, newMessage])
        setMessage('')
        setShowPresets(false)

        // Загружаем сообщения через небольшую задержку для получения ответов
        setTimeout(loadMessages, 500)
      } else {
        throw new Error('Ошибка отправки сообщения')
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(message)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isWorkingHours = () => {
    const now = new Date()
    const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}))
    const hours = moscowTime.getHours()
    return hours >= 9 && hours < 21
  }

  const hasSupportMessage = messages.some((m) => !m.is_from_user)

  return (
    <div className={`relative ${className}`}>
      {isOpen ? (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-lg flex flex-col h-96">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 rounded-t-xl">
            <span className="font-medium text-sm">Чат поддержки</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-red-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {!hasSupportMessage && (
              <div className="bg-zinc-100 dark:bg-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 p-3 rounded-lg max-w-[90%]">
                Привет! Добро пожаловать в техническую поддержку. Мы работаем по расписанию, указанному на сайте. Выберите тему вопроса ниже или напишите нам.
              </div>
            )}

            {showPresets && (
              <div className="space-y-2">
                {presetOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => sendMessage(opt)}
                    disabled={loading}
                    className="w-full text-left bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-2 rounded-lg text-sm ${
                  msg.is_from_user
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                  <div className={`text-xs mt-1 opacity-70 ${
                    msg.is_from_user ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  Отправка...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Поле ввода */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите сообщение..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(message)}
                disabled={loading || !message.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {!isWorkingHours() && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Сейчас нерабочее время. Ответ может занять больше времени.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Кнопка открытия чата */
        <div className="flex justify-center">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all hover:scale-105 shadow-lg"
            aria-label="Открыть чат поддержки"
          >
            <MessageCircle className="w-5 h-5" />
            Открыть чат поддержки
          </button>
        </div>
      )}

      {/* Плавающая кнопка Telegram */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <a
            href="https://t.me/DonateRaid"
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white text-xl transition-all hover:scale-105"
            aria-label="Написать в Telegram"
            title="Написать в Telegram"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}