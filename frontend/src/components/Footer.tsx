import Link from 'next/link'
import { Send, Globe, PlayCircle, Music } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-8 py-6 px-4 sm:px-6 lg:px-8 text-sm text-zinc-600 dark:text-zinc-400">
      <div className="max-w-screen-xl mx-auto space-y-4">
        {/* Навигация */}
        <div className="flex flex-wrap justify-center gap-6">
          <Link href="/" className="hover:text-blue-500 transition">Главная</Link>
          <Link href="/reviews" className="hover:text-blue-500 transition">Отзывы</Link>
          <Link href="/support" className="hover:text-blue-500 transition">Поддержка</Link>
          <Link href="/faq" className="hover:text-blue-500 transition">FAQ</Link>
          <Link href="/blog" className="hover:text-blue-500 transition">Блог</Link>
        </div>

        {/* Описание */}
        <p className="max-w-3xl mx-auto text-center leading-relaxed">
          DonateRaid — платформа для безопасного доната в игры и сервисы. Мы используем надёжные способы оплаты и гарантируем качество выполнения заказов. Ваша безопасность — наш приоритет.
        </p>

        {/* Юр + соцсети */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-blue-500 transition">Политика</Link>
            <Link href="/terms" className="hover:text-blue-500 transition">Пользовательское соглашение</Link>
            <Link href="/refunds" className="hover:text-blue-500 transition">Возвраты</Link>
          </div>

          <div className="flex gap-4">
            <a href="https://t.me/yourbot" target="_blank" className="hover:text-blue-500"><Send className="w-5 h-5" /></a>
            <a href="https://vk.com/..." target="_blank" className="hover:text-blue-500"><Globe className="w-5 h-5" /></a>
            <a href="https://youtube.com/..." target="_blank" className="hover:text-red-500"><PlayCircle className="w-5 h-5" /></a>
            <a href="https://tiktok.com/..." target="_blank" className="hover:text-pink-500"><Music className="w-5 h-5" /></a>
          </div>
        </div>

        {/* Копирайт */}
        <div className="text-center text-xs text-zinc-500 dark:text-zinc-600">
          © DonateRaid {new Date().getFullYear()} • Все права защищены
        </div>
      </div>
    </footer>
  )
}
