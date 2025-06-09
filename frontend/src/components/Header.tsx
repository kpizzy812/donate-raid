'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { useUser } from '@/hooks/useUser'
import { ShoppingCart, ReceiptText } from 'lucide-react'

const navItems = [
  { label: 'Главная', href: '/' },
  { label: 'Отзывы', href: '/reviews' },
  { label: 'Поддержка', href: '/support' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Блог', href: '/blog' },
]

export default function Header() {
  const pathname = usePathname()
  const { user, isAuth } = useUser()

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-zinc-900 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-3 max-w-screen-xl mx-auto">

        {/* Верх: логотип + экшены */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            DonateRaid
          </Link>

          <div className="flex items-center gap-3">
            {isAuth && (
              <span className="text-xs flex items-center gap-1 text-zinc-500 dark:text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1.5c-5.8 0-10.5 4.7-10.5 10.5S6.2 22.5 12 22.5 22.5 17.8 22.5 12 17.8 1.5 12 1.5zm0 18.6c-4.5 0-8.1-3.6-8.1-8.1S7.5 3.9 12 3.9 20.1 7.5 20.1 12 16.5 20.1 12 20.1z"/>
                  <path d="M12 6.6c-1.5 0-2.7 1.2-2.7 2.7S10.5 12 12 12s2.7-1.2 2.7-2.7S13.5 6.6 12 6.6zm0 6.6c-2.2 0-6.6 1.1-6.6 3.3v.6h13.2v-.6c0-2.2-4.4-3.3-6.6-3.3z"/>
                </svg>
                {user?.balance?.toFixed(2)} ₽
              </span>
            )}

            <ThemeToggle />

            <Link
              href="/orders"
              className="text-zinc-500 dark:text-zinc-300 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-md transition"
            >
              <ReceiptText className="w-5 h-5" />
            </Link>

            <Link
              href="/order/cart"
              className="text-zinc-500 dark:text-zinc-300 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-md transition"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {isAuth ? (
              <Link href="/me">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold hover:opacity-90 transition hover:ring-2 hover:ring-blue-300">
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '👤'}
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-1.5 rounded-md text-sm"
              >
                Войти
              </Link>
            )}
          </div>
        </div>

        {/* Навигация */}
        <nav className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-sm sm:text-base overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition whitespace-nowrap px-2 py-1 rounded-md
                hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105
                hover:text-blue-500 duration-200 ease-in-out ${
                  pathname === item.href
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
