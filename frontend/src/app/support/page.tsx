// frontend/src/app/support/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'

const SupportChat = dynamic(() => import('@/components/SupportChat'), { ssr: false })

export default function SupportPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Поддержка</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Загрузка чата...</p>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Поддержка</h1>

      <div className="space-y-6 text-zinc-700 dark:text-zinc-300">
        <p>
          Если у вас возникли вопросы, проблемы с оплатой или заказом — мы на связи!
        </p>

        <ul className="list-disc list-inside space-y-1">
          <li>Вы можете задать вопрос прямо через чат ниже</li>
          <li>Либо напишите нам в Telegram для быстрого ответа</li>
        </ul>

        {/* Telegram кнопка */}
        <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Напишите нам в Telegram
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Самый быстрый способ получить помощь - написать напрямую в наш Telegram канал поддержки.
          </p>
          <a
            href="https://t.me/DonateRaid"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Написать в Telegram
          </a>
        </div>

        <hr className="my-6 border-zinc-300 dark:border-zinc-700" />

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Онлайн чат
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Можете также написать через чат ниже. Мы работаем с 09:00 до 21:00 (МСК).
          </p>
        </div>

        <SupportChat />
      </div>
    </main>
  )
}