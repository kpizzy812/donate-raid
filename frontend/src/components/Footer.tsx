// frontend/src/components/Footer.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ С ПРАВОВЫМИ ДОКУМЕНТАМИ
import Link from 'next/link'
import { Send, Globe, PlayCircle, Music } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-8 py-6 px-4 sm:px-6 lg:px-8 text-sm text-zinc-600 dark:text-zinc-400 mb-16 md:mb-0">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Навигация */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6">
          <Link href="/" className="hover:text-blue-500 transition text-center">Главная</Link>
          <Link href="/reviews" className="hover:text-blue-500 transition text-center">Отзывы</Link>
          <Link href="/support" className="hover:text-blue-500 transition text-center">Поддержка</Link>
          <Link href="/faq" className="hover:text-blue-500 transition text-center">FAQ</Link>
          <Link href="/blog" className="hover:text-blue-500 transition text-center">Блог</Link>
        </div>

        {/* Правовые документы */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <Link href="/legal/terms" className="hover:text-blue-500 transition text-center">
            Пользовательское соглашение
          </Link>
          <Link href="/legal/privacy" className="hover:text-blue-500 transition text-center">
            Политика конфиденциальности
          </Link>
          <Link href="/legal/offer" className="hover:text-blue-500 transition text-center">
            Публичная оферта
          </Link>
          <Link href="/legal/refund" className="hover:text-blue-500 transition text-center">
            Политика возврата
          </Link>
        </div>

        {/* Описание */}
        <p className="max-w-3xl mx-auto text-center leading-relaxed text-xs sm:text-sm">
          DonateRaid — платформа для безопасного доната в игры и сервисы.
          Мы работаем в соответствии с законодательством РФ и используем надёжные способы оплаты.
          Ваша безопасность — наш приоритет.
        </p>

        {/* Реквизиты и информация */}
        <div className="text-center space-y-2 text-xs text-zinc-500 dark:text-zinc-600 border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <div>ИП Губайдуллин Родион Азаматович</div>
          <div>ОГРНИП: 325028000112629 | ИНН: 860330130390</div>
          <div>Telegram поддержки: @DonateRaid | Email: support@donateraid.ru</div>
        </div>

        {/* Социальные сети и копирайт */}
        <div className="flex flex-col items-center gap-4">
          {/* Социальные сети */}
          <div className="flex gap-6">
            <a
              href="https://t.me/DonateRaid"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              aria-label="Telegram"
            >
              <Send className="w-5 h-5" />
            </a>
            <a
              href="https://vk.com/donateraid"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              aria-label="VKontakte"
            >
              <Globe className="w-5 h-5" />
            </a>
          </div>

          {/* Копирайт */}
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-600">
            © DonateRaid {new Date().getFullYear()} • Все права защищены
          </div>
        </div>
      </div>
    </footer>
  )
}