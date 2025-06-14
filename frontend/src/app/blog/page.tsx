// frontend/src/app/blog/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Calendar, User, Tag, Eye } from 'lucide-react'
import { api } from '@/lib/api'

interface ArticleTag {
  id: number
  name: string
  slug: string
  color?: string
}

interface Article {
  id: number
  slug: string
  title: string
  content: string
  category: string
  created_at: string
  author_name?: string
  featured_image_url?: string
  featured_image?: string
  tags?: ArticleTag[]
  views?: number
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (search) params.append('q', search)
        if (category) params.append('category', category)

        const res = await api.get(`/articles?${params.toString()}`)
        console.log('Загруженные статьи:', res.data)
        setArticles(res.data)
      } catch (error) {
        console.error('Ошибка загрузки статей:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [search, category])

  const categories = [
    'Новости',
    'Гайды',
    'Промокоды',
    'Обзоры',
    'ПК Игры',
    'Мобильные игры',
  ]

  const truncateText = (text: string, maxLength: number) => {
    const plainText = text.replace(/<[^>]*>/g, '')
    return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText
  }

  const getImageFromContent = (content: string) => {
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
    return imgMatch ? imgMatch[1] : null
  }

  // Функция для получения изображения статьи
  const getArticleImage = (article: Article) => {
    return article.featured_image_url || article.featured_image || getImageFromContent(article.content)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Блог DonateRaid</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Новости, гайды и полезная информация о мире игр
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-80 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск статей..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag size={18} />
              Категории
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-md transition ${
                  category === null
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Все статьи
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? null : cat)}
                  className={`w-full text-left px-3 py-2 rounded-md transition ${
                    cat === category
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Popular tags */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Популярные теги</h3>
            <div className="flex flex-wrap gap-2">
              {['genshin-impact', 'valorant', 'mobile-games', 'free-to-play', 'updates'].map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-zinc-500">Загружаем статьи...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 text-lg">Статьи не найдены</p>
              {search && (
                <p className="text-sm text-zinc-400 mt-2">
                  По запросу "{search}" ничего не найдено
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map(article => {
                const featuredImage = getArticleImage(article)

                return (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="group bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      {featuredImage ? (
                        <img
                          src={featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-2xl">📰</div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Category */}
                      <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                        {article.category || 'Статья'}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold group-hover:text-blue-600 transition line-clamp-2 mb-2">
                        {article.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                        {truncateText(article.content, 100)}
                      </p>

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs"
                            >
                              #{tag.name}
                            </span>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs">
                              +{article.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <User size={12} />
                          <span>{article.author_name || 'DonateRaid'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          <time dateTime={article.created_at}>
                            {new Date(article.created_at).toLocaleDateString('ru-RU')}
                          </time>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}