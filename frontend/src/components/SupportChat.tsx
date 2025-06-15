// frontend/src/components/SupportChat.tsx - РЕЖИМ МОДАЛЬНОГО ОКНА
'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Clock } from 'lucide-react'
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
      // Тихая загрузка без показа лоадера
      loadMessagesQuietly()
    }, 3000)

    return () => clearInterval(interval)
  }, [chatInitialized, guestId])

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

        // Обновляем сообщения только если они изменились
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
            console.log('Обновлены сообщения:', newMessages.length)
            return newMessages
          }
          return prevMessages
        })

        if (newMessages.length > 0) {
          setShowPresets(false)
        }
      }
    } catch (error) {
      // Тихо игнорируем ошибки при автообновлении
      console.debug('Ошибка автообновления сообщений:', error)
    }
  }

  const loadMessages = async () => {
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
        console.log('Загружены сообщения:', data)
        setMessages(Array.isArray(data) ? data : [])
        if (data.length > 0) {
          setShowPresets(false)
        }
      } else {
        console.error('Ошибка API:', await response.text())
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      console.log('Отправляем сообщение:', { message: text.trim() })

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text.trim()
        })
      })

      if (response.ok) {
        const newMessage = await response.json()
        console.log('Получен ответ:', newMessage)
        setMessages(prev => [...prev, newMessage])
        setMessage('')
        setShowPresets(false)

        // Загружаем сообщения через небольшую задержку для получения ответов
        setTimeout(loadMessages, 500)
      } else {
        const errorText = await response.text()
        console.error('Ошибка API:', response.status, errorText)
        throw new Error(`Ошибка отправки сообщения: ${response.status}`)
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
      alert('Ошибка отправки сообщения. Попробуйте еще раз.')
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
    <div className={`w-full h-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-lg flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 rounded-t-xl">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-sm">Чат поддержки</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-4 h-4" />
          <span>{workingHours.start}-{workingHours.end} {workingHours.timezone}</span>
          {!isWorkingHours() && (
            <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
              Нерабочее время
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!hasSupportMessage && (
          <div className="bg-zinc-100 dark:bg-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 p-4 rounded-lg">
            <div className="font-medium mb-2">👋 Добро пожаловать в поддержку!</div>
            <div className="text-xs opacity-75">
              Мы работаем {workingHours.start}-{workingHours.end} {workingHours.timezone}.
              {!isWorkingHours() && (
                <div className="mt-1 text-amber-600 dark:text-amber-400">
                  Сейчас нерабочее время. Ответим при первой возможности!
                </div>
              )}
            </div>
          </div>
        )}

        {showPresets && (
          <div className="space-y-2">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Выберите тему вопроса:</div>
            <div className="grid gap-2">
              {presetOptions.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(preset)}
                  className="text-left p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm transition-all hover:shadow-sm"
                  disabled={loading}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                msg.is_from_user
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.message}</div>
              <div
                className={`text-xs mt-1 ${
                  msg.is_from_user
                    ? 'text-blue-200'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {formatTime(msg.created_at)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-700 p-3 rounded-lg text-sm text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span className="ml-2">Отправляем сообщение...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-b-xl">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишите ваше сообщение..."
            className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(message)}
            disabled={!message.trim() || loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center font-medium"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}