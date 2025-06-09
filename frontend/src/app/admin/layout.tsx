// frontend/src/app/admin/layout.tsx

'use client'

import { useUser } from '@/hooks/useUser'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const sections = [
  { href: '/admin/articles', label: 'Статьи' },
  { href: '/admin/games', label: 'Игры' },
  { href: '/admin/products', label: 'Товары' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/users', label: 'Пользователи' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login')
    }
  }, [user, loading])

  if (loading || !user || user.role !== 'admin') {
    return <div className="p-6 text-center">Загрузка...</div>
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white p-4 space-y-4">
        <h2 className="text-xl font-bold mb-6">Админка</h2>
        <ul className="space-y-2">
          {sections.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="block hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <button onClick={logout} className="mt-8 text-red-400 hover:underline">Выйти</button>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-zinc-950 text-white p-8">
        {children}
      </main>
    </div>
  )
}
