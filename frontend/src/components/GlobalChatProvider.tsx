// frontend/src/components/GlobalChatProvider.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Bell } from 'lucide-react'
import dynamic from 'next/dynamic'

// Динамически загружаем чат без SSR
const SupportChat = dynamic(() => import('./SupportChat'), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg h-full flex items-center justify-center">
      <p className="text-zinc-500 dark:text-zinc-400">Загрузка чата...</p>
    </div>
  )
})

export default function GlobalChatProvider() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Слушаем событие для открытия чата с страницы поддержки
    const handleOpenChat = () => {
      setIsChatOpen(true)
    }

    window.addEventListener('openGlobalChat', handleOpenChat)

    return () => {
      window.removeEventListener('openGlobalChat', handleOpenChat)
    }
  }, [])

  // Блокируем скролл страницы при открытом чате
  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isChatOpen])

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Плавающая кнопка чата */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-[9998]">
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 relative group"
            title="Открыть чат поддержки"
          >
            <MessageCircle className="w-6 h-6" />

            {/* Пульсирующий эффект */}
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75 group-hover:opacity-0 transition-opacity"></div>
          </button>
        </div>
      )}

      {/* Модальное окно чата */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          {/* Контейнер чата */}
          <div className="relative w-full max-w-2xl h-[600px] max-h-[90vh]">
            {/* ИСПРАВЛЕНО: передаем onClose в ваш оригинальный SupportChat */}
            <SupportChat onClose={() => setIsChatOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}