// frontend/src/components/SupportChat.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface SupportMessage {
  id: number
  user_id: number | null
  message: string
  is_from_user: boolean
  created_at: string
  status: 'new' | 'in_progress' | 'resolved'
  admin_id?: number
  thread_id?: number
}

const presetOptions = [
  'Проблема с заказом 😕',
  'Проблема с оплатой 💳',
  'Нужен возврат 🔙',
  'Проблема/вопрос по сайту 🌐',
  'Сотрудничество 🤝',
  'Другой вопрос ❓'
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function SupportChat() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showPresets, setShowPresets] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [guestId, setGuestId] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Получаем или создаем guest_id
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

  // Функция загрузки сообщений с бэка
  async function fetchMessages() {
    try {
      const res = await fetch(`${API_URL}/support/my?guest_id=${guestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json()

      if (Array.isArray(data)) {
        // Отображаем ровно полученный массив
        setMessages(data)
        if (data.length > 0) {
          setShowPresets(false)
        }
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('Ошибка загрузки сообщений', err)
      setMessages([])
    }
  }

  // Отправка нового сообщения
  async function sendMessage(content: string) {
    if (!content.trim()) return
    setLoading(true)

    try {
      // Кладем guest_id в query
      const url = `${API_URL}/support/message?guest_id=${guestId}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: content })
      })

      if (!res.ok) {
        throw new Error('Ошибка отправки')
      }

      // Сервер вернул сохраненный объект
      const saved: SupportMessage = await res.json()
      // Добавляем его в список
      setMessages((prev) => [...prev, saved])
      setShowPresets(false)
    } catch (err) {
      console.error('Ошибка отправки сообщения', err)
    } finally {
      setLoading(false)
      setMessage('')
      // После отправки - подождем, чтобы подгрузить ответы техподдержки
      setTimeout(fetchMessages, 500)
    }
  }

  // При загрузке guestId запускаем fetch и ставим интервал
  useEffect(() => {
    if (guestId !== '') {
      fetchMessages()
      const interval = setInterval(fetchMessages, 10000)
      return () => clearInterval(interval)
    }
  }, [guestId, token])

  // Скроллим вниз при новом списке
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const hasSupportMessage = messages.some((m) => !m.is_from_user)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 h-[500px] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 rounded-t-xl">
            <span className="font-medium text-sm">Поддержка</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-red-500 transition"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {!hasSupportMessage && (
              <div className="bg-zinc-100 dark:bg-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 p-3 rounded-lg max-w-[90%]">
                Привет! Добро пожаловать в техническую поддержку. Мы работаем по расписанию, указанному на сайте. Выберите тему вопроса ниже или напишите нам.
              </div>
            )}

            {showPresets && (
              <div className="flex flex-wrap gap-2 mt-2">
                {presetOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => sendMessage(opt)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-full border text-sm border-zinc-400 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={`${msg.id}-${msg.created_at}`}
                className={`max-w-[90%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                  msg.is_from_user
                    ? 'ml-auto bg-blue-100 text-zinc-900 dark:bg-blue-600 dark:text-white'
                    : 'mr-auto bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100'
                }`}
              >
                {/* Если сообщение не от пользователя, помечаем как Оператор */}
                {!msg.is_from_user && (
                  <div className="text-[10px] font-semibold mb-1">Оператор:</div>
                )}
                {msg.message}
                <div className="text-[10px] mt-1 opacity-60 text-right">
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2 p-3 border-t border-zinc-200 dark:border-zinc-700">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Введите сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(message)}
            />
            <button
              onClick={() => sendMessage(message)}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white text-xl"
          aria-label="Открыть чат поддержки"
        >
          💬
        </button>
      )}
    </div>
  )
}
