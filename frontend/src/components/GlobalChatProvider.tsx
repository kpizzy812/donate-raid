// frontend/src/components/GlobalChatProvider.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import SupportChat from './SupportChat'

export default function GlobalChatProvider() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      {/* Кнопка чата (показывается только когда чат закрыт) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all z-[9999] group hover:scale-110"
          title="Открыть чат поддержки"
        >
          <MessageCircle className="w-6 h-6" />

          {/* Пульсирующий эффект */}
          <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75"></div>
        </button>
      )}

      {/* Оверлей и чат */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          {/* Контейнер чата */}
          <div className="relative w-full max-w-2xl h-[600px] max-h-[90vh]">
            {/* Кнопка закрытия */}
            <button
              onClick={() => setIsChatOpen(false)}
              className="absolute -top-12 right-0 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 p-2 rounded-full shadow-lg transition-all z-10"
              title="Закрыть чат"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Сам чат */}
            <div className="w-full h-full">
              <SupportChat />
            </div>
          </div>
        </div>
      )}
    </>
  )
}