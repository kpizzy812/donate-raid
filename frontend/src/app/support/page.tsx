// src/app/support/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

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

      <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
        <p>
          Если у вас возникли вопросы, проблемы с оплатой или заказом — мы на связи!
        </p>

        <ul className="list-disc list-inside space-y-1">
          <li>Вы можете задать вопрос прямо через чат ниже</li>
          <li>Либо нажмите кнопку, чтобы перейти в Telegram</li>
        </ul>

        <a
          href="https://t.me/donateraid_support"
          target="_blank"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition"
        >
          Написать в Telegram
        </a>

        <hr className="my-6 border-zinc-300 dark:border-zinc-700" />

        <SupportChat />
      </div>
    </main>
  )
}
