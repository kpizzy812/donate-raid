// frontend/src/components/SupportChat.tsx - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageCircle, Clock, CheckCircle } from 'lucide-react'
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
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(0)

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

  // Отслеживаем скролл пользователя
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    setUserHasScrolled(!isNearBottom)
    if (isNearBottom) {
      setShouldAutoScroll(true)
    }
  }, [])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const scrollToBottomSmooth = useCallback(() => {
    if (shouldAutoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [shouldAutoScroll])

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      if (shouldAutoScroll) {
        setTimeout(scrollToBottomSmooth, 100)
      }
      lastMessageCountRef.current = messages.length
    }
  }, [messages, scrollToBottomSmooth, shouldAutoScroll])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Автообновление сообщений каждые 8 секунд
  useEffect(() => {
    if (!chatInitialized || !guestId) return

    const interval = setInterval(() => {
      loadMessagesQuietly()
    }, 8000)

    return () => clearInterval(interval)
  }, [chatInitialized, guestId])

  // ✅ ИСПРАВЛЕННАЯ функция загрузки - ВСЕГДА передаем guest_id
  const loadMessagesQuietly = async () => {
    if (!guestId) return

    try {
      // ✅ ВСЕГДА передаем guest_id, даже если есть токен
      const url = `${process.env.NEXT_PUBLIC_API_URL}/support/my?guest_id=${guestId}`
      const headers: Record<string, string> = {}

      // ✅ Если есть токен - передаем и его тоже
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })

      if (response.ok) {
        const data = await response.json()
        const serverMessages: SupportMessage[] = Array.isArray(data) ? data : []

        // Умное обновление без потери оптимистичных сообщений
        setMessages(prev => {
          const optimisticMessages = prev.filter(msg =>
            msg.status === 'sending' || msg.status === 'sent'
          )

          if (serverMessages.length === prev.filter(msg => !optimisticMessages.includes(msg)).length && optimisticMessages.length === 0) {
            return prev
          }

          // Объединяем серверные + оптимистичные, убираем дубли
          const combined = [...serverMessages]

          optimisticMessages.forEach(optMsg => {
            const exists = serverMessages.find((sMsg: SupportMessage) =>
              sMsg.message === optMsg.message &&
              Math.abs(new Date(sMsg.created_at).getTime() - new Date(optMsg.created_at).getTime()) < 5000
            )
            if (!exists) {
              combined.push(optMsg)
            }
          })

          return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        })
      }
    } catch (error) {
      console.error('Ошибка при тихой загрузке сообщений:', error)
    }
  }

  const loadMessages = async () => {
    if (!guestId) return

    setLoading(true)
    try {
      // ✅ ВСЕГДА передаем guest_id
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
        lastMessageCountRef.current = newMessages.length

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

    const tempId = Date.now() + Math.random()

    const optimisticMessage: SupportMessage = {
      id: tempId,
      message: trimmedMessage,
      is_from_user: true,
      created_at: new Date().toISOString(),
      status: 'sending'
    }

    setMessages(prev => [...prev, optimisticMessage])
    setShouldAutoScroll(true)
    setUserHasScrolled(false)

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
          guest_id: guestId  // ✅ ВСЕГДА передаем guest_id
        })
      })

      if (response.ok) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? { ...msg, status: 'sent' }
              : msg
          )
        )

        // Загружаем обновления через 2 секунды
        setTimeout(() => {
          loadMessagesQuietly()
        }, 2000)

        setShowPresets(false)
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        console.error('Ошибка отправки сообщения:', response.status)
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      console.error('Ошибка при отправке сообщения:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendPreset = (preset: string) => {
    sendMessage(preset)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isWorkingHours = () => {
    const now = new Date()
    const currentHour = now.getHours()
    return currentHour >= 9 && currentHour < 21
  }

  const handleBackToBottom = () => {
    setShouldAutoScroll(true)
    setUserHasScrolled(false)
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-zinc-900 ${className}`}>
      {/* Область сообщений */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-zinc-500 dark:text-zinc-400">Загрузка...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center text-zinc-500 dark:text-zinc-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Привет! Как дела? 👋</p>
              <p className="text-sm">
                {isWorkingHours()
                  ? `Мы онлайн и готовы помочь! (${workingHours.start}-${workingHours.end} ${workingHours.timezone})`
                  : `Мы сейчас оффлайн, но ответим в рабочие часы (${workingHours.start}-${workingHours.end} ${workingHours.timezone})`
                }
              </p>
            </div>

            {showPresets && (
              <div className="space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                  Выберите тему или напишите свой вопрос:
                </p>
                <div className="grid gap-2">
                  {presetOptions.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => sendPreset(preset)}
                      disabled={loading}
                      className="text-left p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.is_from_user ? 'order-2' : 'order-1'}`}>
                <div
                  className={`p-3 rounded-2xl ${
                    msg.is_from_user
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs ${
                      msg.is_from_user
                        ? 'text-blue-200'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.is_from_user && (
                      <CheckCircle className={`w-3 h-3 ${
                        msg.status === 'sending' ? 'text-blue-300 animate-pulse' :
                        msg.status === 'sent' ? 'text-blue-200' :
                        'text-blue-200'
                      }`} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />

        {userHasScrolled && messages.length > 0 && (
          <div className="sticky bottom-4 flex justify-center">
            <button
              onClick={handleBackToBottom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              ↓ К последнему сообщению
            </button>
          </div>
        )}
      </div>

      {/* Поле ввода */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Напишите ваше сообщение..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!message.trim() || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {!isWorkingHours() && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            💡 Мы ответим в рабочие часы: {workingHours.start}-{workingHours.end} {workingHours.timezone}
          </p>
        )}
      </div>
    </div>
  )
}