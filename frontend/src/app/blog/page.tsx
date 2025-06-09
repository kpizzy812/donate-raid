// frontend/src/app/blog/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArticleRead } from '@/types/article'
import { api } from '@/lib/api'

export default function BlogPage() {
  const [articles, setArticles] = useState<ArticleRead[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.append('q', search)
    if (category) params.append('category', category)

    api.get(`/articles?${params.toString()}`).then(res => {
      setArticles(res.data)
    })
  }, [search, category])

  const categories = [
    'Новости',
    'Гайды',
    'Промокоды',
    'Обзоры',
    'ПК Игры',
    'Мобильные игры',
  ]

  return (
    <div className="flex gap-6 p-6">
      {/* Sidebar */}
      <aside className="w-64 space-y-2">
        <input
          type="text"
          placeholder="Поиск статьи..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded bg-zinc-800 text-white"
        />

        <div className="mt-4">
          <h3 className="text-sm font-bold mb-2 text-zinc-400">Категории</h3>
          <ul className="space-y-1">
            {categories.map(cat => (
              <li key={cat}>
                <button
                  onClick={() => setCategory(cat === category ? null : cat)}
                  className={`text-sm px-2 py-1 rounded hover:bg-zinc-700 w-full text-left ${cat === category ? 'bg-zinc-700' : ''}`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Articles */}
      <main className="flex-1 grid grid-cols-2 gap-4">
        {articles.map(article => (
          <Link
            key={article.id}
            href={`/blog/${article.slug}`}
            className="bg-zinc-800 rounded-xl p-4 hover:bg-zinc-700 transition"
          >
            <h2 className="text-lg font-bold mb-1 text-white">{article.title}</h2>
            <p className="text-sm text-zinc-400 mb-2">{article.category} · {new Date(article.created_at).toLocaleDateString()}</p>
            <p className="text-sm text-zinc-300 line-clamp-3">{article.content.replace(/<[^>]*>?/gm, '').slice(0, 200)}...</p>
          </Link>
        ))}
      </main>
    </div>
  )
}
