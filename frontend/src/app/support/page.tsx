// frontend/src/app/support/page.tsx - БЕЗ ЧАТА
'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Send, Clock, Mail } from 'lucide-react'

export default function SupportPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Функция для открытия глобального чата
  const openGlobalChat = () => {
    // Генерируем событие для открытия глобального чата
    window.dispatchEvent(new CustomEvent('openGlobalChat'))
  }

  if (!mounted) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Поддержка</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Загрузка...</p>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Поддержка</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Информационные карточки */}
        <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Telegram поддержка
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Самый быстрый способ получить помощь
          </p>
          <a
            href="https://t.me/donateraid"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Send className="w-4 h-4" />
            Написать в Telegram
          </a>
        </div>

        <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Онлайн чат
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Общайтесь прямо на сайте в реальном времени
          </p>
          <button
            onClick={openGlobalChat}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Открыть чат
          </button>
        </div>

        <div className="bg-orange-50 dark:bg-orange-950 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Время работы
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Ежедневно: 09:00 - 21:00 МСК
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Среднее время ответа: 5 минут
          </p>
        </div>
      </div>

      <div className="space-y-6 text-zinc-700 dark:text-zinc-300 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-3">Частые вопросы</h2>
          <div className="space-y-3 text-sm">
            <details className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
              <summary className="font-medium cursor-pointer">Проблемы с оплатой</summary>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Если оплата не прошла, проверьте баланс карты и попробуйте еще раз.
                При повторных проблемах обратитесь к нам в чат.
              </p>
            </details>
            <details className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
              <summary className="font-medium cursor-pointer">Статус заказа</summary>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Отслеживать статус заказа можно в личном кабинете.
                Обычно заказы выполняются в течение 1-24 часов.
              </p>
            </details>
            <details className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
              <summary className="font-medium cursor-pointer">Возврат средств</summary>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Возврат возможен в течение 24 часов после оплаты,
                если заказ еще не был выполнен.
              </p>
            </details>
            <details className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
              <summary className="font-medium cursor-pointer">Безопасность</summary>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Мы используем защищенные каналы связи и не храним платежные данные.
                Все транзакции проходят через проверенные платежные системы.
              </p>
            </details>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Свяжитесь с нами</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Выберите удобный способ связи. Мы всегда готовы помочь!
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={openGlobalChat}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              Онлайн чат
            </button>

            <a
              href="https://t.me/donateraid"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all hover:scale-105"
            >
              <Send className="w-5 h-5" />
              Telegram
            </a>

            <a
              href="mailto:support@donateraid.com"
              className="flex items-center gap-2 bg-zinc-600 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-all hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              Email
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}