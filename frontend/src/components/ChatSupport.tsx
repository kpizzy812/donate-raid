// frontend/src/components/ChatSupport.tsx - НОВЫЙ КОМПОНЕНТ
'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
  id: number
  message: string
  is_from_user: boolean
  created_at: string
}

interface ChatSupportProps {
  isOpen: boolean
  onToggle: () => void
}

export default function ChatSupport({ isOpen, onToggle }: ChatSupportProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      setHasUnreadMessages(false)
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Polling для новых сообщений каждые 5 секунд
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      loadMessages(true) // silent load
    }, 5000)

    return () => clearInterval(interval)
  }, [isOpen])

  const loadMessages = async (silent = false) => {
    if (!silent) setIsLoading(true)

    try {
      const token = localStorage.getItem('access_token')
      const guestId = localStorage.getItem('guest_id') || generateGuestId()

      const response = await fetch('/api/support/messages', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        method: 'POST',
        body: JSON.stringify({ guest_id: guestId }),
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })

      if (response.ok) {
        const data = await response.json()
        const currentMessageCount = messages.length
        setMessages(data.messages || [])

        // Если появились новые сообщения и чат закрыт, показываем уведомление
        if (!isOpen && data.messages?.length > currentMessageCount) {
          setHasUnreadMessages(true)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const token = localStorage.getItem('access_token')
    const guestId = localStorage.getItem('guest_id') || generateGuestId()

    try {
      const response = await fetch('/api/support/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: newMessage,
          guest_id: token ? undefined : guestId
        })
      })

      if (response.ok) {
        setNewMessage('')
        loadMessages() // Перезагружаем сообщения
      } else {
        alert('Ошибка отправки сообщения')
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
      alert('Ошибка отправки сообщения')
    }
  }

  const generateGuestId = () => {
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('guest_id', guestId)
    return guestId
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all z-50 ${
          hasUnreadMessages ? 'animate-bounce' : ''
        }`}
      >
        <MessageCircle className="w-6 h-6" />
        {hasUnreadMessages && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            !
          </div>
        )}
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 transition-all ${
      isMinimized ? 'w-80 h-16' : 'w-80 h-96'
    }`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Поддержка</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-blue-700 p-1 rounded"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onToggle}
            className="hover:bg-blue-700 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3">
            {isLoading && messages.length === 0 ? (
              <div className="text-center text-zinc-400">Загрузка...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-zinc-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Начните диалог с поддержкой</p>
                <p className="text-xs">Мы обычно отвечаем в течение 5 минут</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_from_user ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-lg text-sm ${
                      message.is_from_user
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-700 text-zinc-100'
                    }`}
                  >
                    <div>{message.message}</div>
                    <div className={`text-xs mt-1 ${
                      message.is_from_user ? 'text-blue-200' : 'text-zinc-400'
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
          <div className="p-3 border-t border-zinc-700">
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите ваше сообщение..."
                className="flex-1 bg-zinc-700 text-white p-2 rounded resize-none text-sm"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white p-2 rounded transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Компонент для интеграции в страницу поддержки
export function SupportPageChat() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <div className="mb-6">
      <div className="bg-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Онлайн поддержка</h2>
        <p className="text-zinc-400 mb-4">
          Есть вопросы? Напишите нам в чат и получите быстрый ответ от нашей команды поддержки.
        </p>
        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center gap-2 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Написать в чат
        </button>
      </div>

      <ChatSupport
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  )
}