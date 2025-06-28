// frontend/src/components/SupportChat.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, X, MessageCircle, Minimize2, Maximize2 } from 'lucide-react'

interface SupportMessage {
  id: number
  message: string
  is_from_user: boolean
  created_at: string
  status?: string
}

interface SupportChatProps {
  onClose: () => void
}

// Генерация guest_id
function generateGuestId(): string {
  const existingId = localStorage.getItem('guest_id')
  if (existingId) return existingId

  const newId = Math.random().toString(36).substring(2, 15)
  localStorage.setItem('guest_id', newId)
  return newId
}

export default function SupportChat({ onClose }: SupportChatProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [guestId] = useState<string>(generateGuestId())
  const [token] = useState<string | null>(localStorage.getItem('access_token'))

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastMessageCountRef = useRef(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Прокрутка к последнему сообщению
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Загрузка сообщений
  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)

    try {
      const params = new URLSearchParams()
      if (!token && guestId) {
        params.append('guest_id', guestId)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/my?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })

      if (response.ok) {
        const data = await response.json()

        // Проверяем, изменилось ли количество сообщений
        const currentCount = data.length
        if (currentCount !== lastMessageCountRef.current) {
          setMessages(data)
          lastMessageCountRef.current = currentCount

          // Прокручиваем только если добавились новые сообщения
          setTimeout(scrollToBottom, 100)
        }
      } else {
        console.error('Ошибка загрузки сообщений:', response.status)
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [token, guestId, scrollToBottom])

  // Отправка сообщения
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return

    const messageText = inputMessage.trim()
    setInputMessage('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: messageText,
          guest_id: !token ? guestId : undefined
        })
      })

      if (response.ok) {
        // Сразу перезагружаем сообщения
        await loadMessages(true)
      } else {
        console.error('Ошибка отправки сообщения:', response.status)
        setInputMessage(messageText) // Восстанавливаем текст при ошибке
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
      setInputMessage(messageText) // Восстанавливаем текст при ошибке
    }
  }, [inputMessage, token, guestId, loadMessages])

  // Обработка нажатия Enter
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  // Форматирование времени
  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Инициализация при загрузке
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Настройка polling для новых сообщений
  useEffect(() => {
    if (!isMinimized) {
      pollingIntervalRef.current = setInterval(() => {
        loadMessages(true)
      }, 3000) // Каждые 3 секунды

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [isMinimized, loadMessages])

  // Фокус на input при открытии
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isMinimized])

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-full">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Поддержка DonateRaid
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Обычно отвечаем в течение 5 минут
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900">
            {isLoading ? (
              <div className="text-center text-zinc-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Загрузка сообщений...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-zinc-400 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Начните диалог с поддержкой</p>
                <p className="text-sm">Мы обычно отвечаем в течение 5 минут</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={`msg-${message.id}`}
                  className={`flex ${message.is_from_user ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.is_from_user
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.message}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.is_from_user
                        ? 'text-blue-200'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите ваше сообщение..."
                className="flex-1 resize-none bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}