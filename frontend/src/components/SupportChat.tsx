// frontend/src/components/SupportChat.tsx - С WEBSOCKET
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

export default function SupportChat({ onClose }: SupportChatProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatInitialized, setChatInitialized] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [guestId, setGuestId] = useState<string>('')
  const [token, setToken] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string>('')

  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = useRef(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastMessageCountRef = useRef(0)

  // Инициализация при загрузке компонента
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    const storedGuestId = localStorage.getItem('guest_id') || generateGuestId()

    setToken(storedToken)
    setGuestId(storedGuestId)

    // Определяем room_id для WebSocket
    if (storedToken) {
      // Нужно получить user_id из токена
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]))
        setRoomId(`user_${payload.sub}`)
      } catch (e) {
        setRoomId(`guest_${storedGuestId}`)
      }
    } else {
      setRoomId(`guest_${storedGuestId}`)
    }

    loadMessages()
    setChatInitialized(true)
  }, [])

  // WebSocket connection
  useEffect(() => {
    if (!chatInitialized || !roomId) return

    connectWebSocket()

    return () => {
      shouldReconnectRef.current = false
      disconnectWebSocket()
    }
  }, [chatInitialized, roomId])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'}/api/support/ws/${roomId}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        // Очищаем таймер переподключения
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'new_message' && data.data) {
            // Добавляем новое сообщение
            setMessages(prev => {
              // Проверяем, что сообщение ещё не добавлено
              const exists = prev.find(msg => msg.id === data.data.id)
              if (exists) return prev

              return [...prev, data.data].sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
            })
          }
        } catch (error) {
          console.error('Ошибка парсинга WebSocket сообщения:', error)
        }
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        wsRef.current = null

        // Переподключение через 3 секунды если нужно
        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

    } catch (error) {
      console.error('Ошибка подключения WebSocket:', error)
    }
  }, [roomId])

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const scrollToBottomSmooth = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const shouldAutoScroll = messages.length > lastMessageCountRef.current

  useEffect(() => {
    if (lastMessageCountRef.current) {
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

  // Fallback polling для случаев когда WebSocket недоступен
  useEffect(() => {
    if (!chatInitialized || !guestId) return

    const interval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        loadMessagesQuietly()
      }
    }, 10000) // Проверяем каждые 10 секунд если нет WebSocket

    return () => clearInterval(interval)
  }, [chatInitialized, guestId])

  const generateGuestId = () => {
    const id = 'guest_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('guest_id', id)
    return id
  }

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
        const serverMessages: SupportMessage[] = Array.isArray(data) ? data : []

        setMessages(prev => {
          const optimisticMessages = prev.filter(msg =>
            msg.status === 'sending' || msg.status === 'sent'
          )

          if (serverMessages.length === prev.filter(msg => !optimisticMessages.includes(msg)).length && optimisticMessages.length === 0) {
            return prev
          }

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

    setIsLoading(true)
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
        lastMessageCountRef.current = newMessages.length
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const messageText = inputMessage.trim()
    setInputMessage('')

    // Добавляем оптимистичное сообщение
    const optimisticMessage: SupportMessage = {
      id: Date.now(),
      message: messageText,
      is_from_user: true,
      created_at: new Date().toISOString(),
      status: 'sending'
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: messageText,
          guest_id: token ? undefined : guestId
        })
      })

      if (response.ok) {
        const sentMessage = await response.json()

        // Заменяем оптимистичное сообщение на реальное
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessage.id ? sentMessage : msg
        ))
      } else {
        throw new Error('Ошибка отправки')
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)

      // Помечаем сообщение как ошибку
      setMessages(prev => prev.map(msg =>
        msg.id === optimisticMessage.id
          ? { ...msg, status: 'error' }
          : msg
      ))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg shadow-lg h-full flex flex-col transition-all ${
      isMinimized ? 'h-16' : ''
    }`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Поддержка</h3>
            <p className="text-xs text-blue-200">
              {wsRef.current?.readyState === WebSocket.OPEN ? 'Онлайн' : 'Подключение...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            title={isMinimized ? 'Развернуть' : 'Свернуть'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            title="Закрыть чат"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-800">
            {isLoading && messages.length === 0 ? (
              <div className="text-center text-zinc-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Загрузка сообщений...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-zinc-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h4 className="font-medium mb-2">Начните диалог с поддержкой</h4>
                <p className="text-sm">Мы обычно отвечаем в течение 5 минут</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_from_user ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm relative ${
                      message.is_from_user
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.message}</div>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${
                      message.is_from_user ? 'text-blue-200' : 'text-zinc-500'
                    }`}>
                      <span>
                        {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {message.is_from_user && (
                        <span className="ml-1">
                          {message.status === 'sending' && '⏳'}
                          {message.status === 'sent' && '✓'}
                          {message.status === 'error' && '❌'}
                          {!message.status && '✓✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите ваше сообщение..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg resize-none text-sm border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
                title="Отправить сообщение"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              Нажмите Enter для отправки, Shift+Enter для новой строки
            </div>
          </div>
        </>
      )}
    </div>
  )
}