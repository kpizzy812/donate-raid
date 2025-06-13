// frontend/src/components/SupportChat.tsx - УЛУЧШЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { X, Send, MessageCircle, Phone, Mail, Clock, User } from 'lucide-react'

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
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const presetOptions = [
    "Проблемы с заказом",
    "Вопрос по оплате",
    "Технические проблемы",
    "Возврат средств",
    "Другой вопрос"
  ]

  const workingHours = {
    start: "09:00",
    end: "21:00",
    timezone: "МСК"
  }

  const supportContacts = {
    email: "support@donate-raid.com",
    telegram: "@donate_raid_support"
  }

  useEffect(() => {
    if (isOpen && !chatInitialized) {
      loadMessages()
      setChatInitialized(true)
    }
  }, [isOpen, chatInitialized])

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
    try {
      const response = await api.get('/support/my-messages')
      setMessages(response.data)
      if (response.data.length > 0) {
        setShowPresets(false)
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    setLoading(true)
    try {
      const response = await api.post('/support/send-message', {
        message: text.trim()
      })

      setMessages(prev => [...prev, response.data])
      setMessage('')
      setShowPresets(false)

      // Автоответ если это первое сообщение
      if (messages.length === 0) {
        setTimeout(() => {
          const autoReply: SupportMessage = {
            id: Date.now(),
            message: `Спасибо за обращение! Ваше сообщение принято. Наши операторы работают с ${workingHours.start} до ${workingHours.end} (${workingHours.timezone})\n\nВ нерабочее время ответ может занять больше времени. Мы обязательно вам поможем!`,
            is_from_user: false,
            created_at: new Date().toISOString()
          }
          setMessages(prev => [...prev, autoReply])
        }, 1000)
      }
    } catch (error: any) {
      console.error('Ошибка отправки сообщения:', error)
      if (error.response?.status === 401) {
        alert('Необходимо авторизоваться для отправки сообщений')
      } else {
        alert('Ошибка отправки сообщения')
      }
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

  const isWorkingHours = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const startHour = parseInt(workingHours.start.split(':')[0])
    const endHour = parseInt(workingHours.end.split(':')[0])

    return currentHour >= startHour && currentHour < endHour
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {isOpen ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-700 w-80 h-96 flex flex-col">
          {/* Заголовок чата */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Поддержка</h3>
                <div className="flex items-center gap-1 text-xs">
                  <div className={`w-2 h-2 rounded-full ${isWorkingHours() ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  {isWorkingHours() ? 'Онлайн' : 'Сейчас офлайн'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && showPresets && (
              <div className="text-center text-zinc-600 dark:text-zinc-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
                <p className="text-sm mb-4">
                  Добро пожаловать в техническую поддержку! Мы работаем по расписанию {workingHours.start}-{workingHours.end} ({workingHours.timezone}).
                </p>
                <p className="text-xs text-zinc-500 mb-4">
                  Выберите тему вопроса или напишите нам:
                </p>
              </div>
            )}

            {showPresets && messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {presetOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => sendMessage(option)}
                    disabled={loading}
                    className="px-3 py-2 rounded-full border text-xs border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={`${msg.id}-${msg.created_at}`}
                className={`max-w-[85%] ${
                  msg.is_from_user ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg text-sm break-words ${
                    msg.is_from_user
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {!msg.is_from_user && (
                    <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
                      <User className="w-3 h-3" />
                      <span>Оператор</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                </div>
                <div className={`text-xs text-zinc-500 mt-1 ${
                  msg.is_from_user ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(msg.created_at)}
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
        <div className="flex flex-col gap-2">
          {/* Основная кнопка чата */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white text-xl transition-all hover:scale-105 relative"
            aria-label="Открыть чат поддержки"
          >
            <MessageCircle className="w-6 h-6" />

            {/* Индикатор статуса */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isWorkingHours() ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
          </button>

          {/* Дополнительные кнопки контактов */}
          <div className="flex flex-col gap-1">
            <a
              href={`mailto:${supportContacts.email}`}
              className="w-10 h-10 rounded-full shadow-md bg-zinc-600 hover:bg-zinc-700 flex items-center justify-center text-white transition-all hover:scale-105"
              title="Написать на email"
            >
              <Mail className="w-4 h-4" />
            </a>

            <a
              href={`https://t.me/${supportContacts.telegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full shadow-md bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-all hover:scale-105"
              title="Написать в Telegram"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.18 1.896-.96 6.504-1.356 8.628-.168.9-.504 1.2-.816 1.236-.696.06-1.224-.456-1.896-.9-1.056-.696-1.656-1.128-2.676-1.8-1.188-.78-.42-1.212.264-1.908.18-.18 3.252-2.976 3.312-3.228a.24.24 0 0 0-.06-.216c-.072-.06-.168-.036-.24-.024-.096.024-1.632 1.032-4.608 3.048-.432.3-.828.444-1.188.432-.396-.012-1.152-.216-1.716-.396-.696-.216-1.248-.336-1.2-.708.024-.192.396-.384.996-.576 4.056-1.776 6.756-2.94 8.112-3.492 3.864-1.608 4.668-1.884 5.184-1.884.12 0 .384.024.552.144.144.096.18.24.204.336-.012.096-.012.288-.024.48z"/>
              </svg>
            </a>
          </div>

          {/* Всплывающая подсказка */}
          <div className="absolute right-16 top-2 bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap">
            Нужна помощь? Напишите нам!
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-zinc-900"></div>
          </div>
        </div>
      )}
    </div>
  )
}