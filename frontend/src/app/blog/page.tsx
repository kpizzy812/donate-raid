// frontend/src/app/blog/page.tsx - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
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
  featured_image?: string  // Свойство из схемы для совместимости
  tags?: ArticleTag[]
  views?: number
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

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
        // Сбрасываем ошибки изображений при новой загрузке
        setImageErrors({})
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

  // ИСПРАВЛЕНО: функция для получения изображения статьи
  const getArticleImage = (article: Article) => {
    // Проверяем все возможные источники изображения
    let imageUrl = article.featured_image_url ||
                   article.featured_image ||
                   getImageFromContent(article.content)

    if (!imageUrl) return null

    // Если URL уже полный, возвращаем как есть
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }

    // Если URL относительный, добавляем базовый URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Функция для обработки ошибок загрузки изображений
  const handleImageError = (articleId: number) => {
    setImageErrors(prev => ({ ...prev, [articleId]: true }))
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
                const hasImageError = imageErrors[article.id]

                console.log(`Статья "${article.title}": featuredImage = ${featuredImage}, hasImageError = ${hasImageError}`) // Отладка

                return (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="group bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                      {featuredImage && !hasImageError ? (
                        <img
                          src={featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onLoad={() => console.log('Изображение загружено успешно:', featuredImage)}
                          onError={(e) => {
                            console.error('Ошибка загрузки изображения:', featuredImage)
                            handleImageError(article.id)
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800">
                          <div className="text-center">
                            <div className="text-4xl text-zinc-400 mb-2">📰</div>
                            <div className="text-xs text-zinc-500">
                              {hasImageError ? 'Ошибка загрузки' : 'Без изображения'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md font-medium">
                          {article.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3 line-clamp-3">
                        {truncateText(article.content, 150)}
                      </p>

                      {/* Meta information */}
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(article.created_at)}</span>
                          </div>

                          {article.author_name && (
                            <div className="flex items-center gap-1">
                              <User size={12} />
                              <span>{article.author_name}</span>
                            </div>
                          )}
                        </div>

                        {article.views && (
                          <div className="flex items-center gap-1">
                            <Eye size={12} />
                            <span>{article.views}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                              style={{ color: tag.color || '#3B82F6' }}
                            >
                              <Tag size={10} />
                              {tag.name}
                            </span>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="text-xs text-zinc-400">
                              +{article.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
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