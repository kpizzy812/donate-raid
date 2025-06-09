// frontend/src/app/admin/page.tsx

'use client'

import Link from 'next/link'

const sections = [
  { href: '/admin/articles', title: 'Статьи', description: 'Управление статьями блога' },
  { href: '/admin/games', title: 'Игры', description: 'Добавление и настройка игр' },
  { href: '/admin/products', title: 'Товары', description: 'Настройка товаров для игр' },
  { href: '/admin/orders', title: 'Заказы', description: 'Просмотр и управление заказами' },
  { href: '/admin/users', title: 'Пользователи', description: 'Список и управление пользователями' },
]

export default function AdminHomePage() {
  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(sec => (
          <Link
            key={sec.href}
            href={sec.href}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-6 rounded-xl shadow flex flex-col gap-1 transition"
          >
            <h2 className="text-xl font-semibold text-white">{sec.title}</h2>
            <p className="text-zinc-400 text-sm">{sec.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
