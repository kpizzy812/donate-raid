// frontend/src/app/blog/page.tsx - НОВЫЙ БЛОГ С ТЕГАМИ И КАТЕГОРИЯМИ
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Calendar, User, Tag, Eye, Filter, X } from 'lucide-react'
import { api } from '@/lib/api'
import { getImageUrl } from '@/lib/imageUtils'

interface ArticleTag {
  id: number
  name: string
  slug: string
  color?: string
  is_category?: boolean
}

interface Article {
  id: number
  slug: string
  title: string
  content: string
  category: string
  categories: string[]  // Множественные категории
  regular_tags: string[]  // Обычные теги
  created_at: string
  author_name?: string
  featured_image_url?: string
  featured_image?: string
  tags?: ArticleTag[]
  views?: number
}

interface CategoryInfo {
  id: number
  name: string
  slug: string
  color: string
  article_count: number
}

interface TagInfo {
  id: number
  name: string
  slug: string
  color: string
  article_count: number
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [allCategories, setAllCategories] = useState<CategoryInfo[]>([])
  const [allTags, setAllTags] = useState<TagInfo[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Загружаем категории и теги
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          api.get('/articles/categories'),
          api.get('/articles/tags')
        ])
        setAllCategories(categoriesRes.data)
        setAllTags(tagsRes.data)
      } catch (error) {
        console.error('Ошибка загрузки фильтров:', error)
      }
    }
    loadFilters()
  }, [])

  // Загружаем статьи с фильтрами
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()

        if (search) params.append('q', search)
        if (selectedCategories.length > 0) {
          params.append('categories', selectedCategories.join(','))
        }
        if (selectedTags.length > 0) {
          params.append('tags', selectedTags.join(','))
        }

        const res = await api.get(`/articles?${params.toString()}`)
        console.log('Загруженные статьи:', res.data)
        setArticles(res.data)
        setImageErrors({})
      } catch (error) {
        console.error('Ошибка загрузки статей:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [search, selectedCategories, selectedTags])

  const truncateText = (text: string, maxLength: number) => {
    const plainText = text.replace(/<[^>]*>/g, '')
    return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText
  }

  const getImageFromContent = (content: string) => {
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
    return imgMatch ? imgMatch[1] : null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getArticleImage = (article: Article) => {
    let imagePath = article.featured_image_url ||
                    article.featured_image ||
                    getImageFromContent(article.content)

    if (!imagePath) return null
    return getImageUrl(imagePath)
  }

  const handleImageError = (articleId: number) => {
    setImageErrors(prev => ({ ...prev, [articleId]: true }))
  }

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    )
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedTags([])
    setSearch('')
  }

  const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0 || search.length > 0


return (
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* Header */}
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold mb-4">Блог DonateRaid</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Новости, гайды и полезная информация о мире игр
      </p>
    </div>

    {/* Mobile Filters - Compact */}
    <div className="lg:hidden mb-6 space-y-4">
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

      {/* Quick Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {allCategories.slice(0, 6).map(category => (
          <button
            key={category.id}
            onClick={() => toggleCategory(category.name)}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap border transition ${
              selectedCategories.includes(category.name)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700'
            }`}
          >
            {category.name} ({category.article_count})
          </button>
        ))}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="px-3 py-1.5 text-sm rounded-full whitespace-nowrap bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
        >
          <Filter size={14} className="inline mr-1" />
          Фильтры
        </button>
      </div>

      {/* Active Filters on Mobile */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map(cat => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            >
              {cat}
              <button onClick={() => toggleCategory(cat)} className="hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full"
            >
              #{tag}
              <button onClick={() => toggleTag(tag)} className="hover:bg-green-200 dark:hover:bg-green-700 rounded-full p-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
          <button onClick={clearAllFilters} className="text-red-600 hover:text-red-700 text-xs">
            Очистить все
          </button>
        </div>
      )}

      {/* Expanded Mobile Filters */}
      {showMobileFilters && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-4">
          {/* All Categories */}
          <div>
            <h4 className="font-medium mb-2">Все категории</h4>
            <div className="grid grid-cols-2 gap-2">
              {allCategories.map(category => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => toggleCategory(category.name)}
                    className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm">{category.name} ({category.article_count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          {allTags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Популярные теги</h4>
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 10).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    className={`px-2 py-1 text-xs rounded-full border transition ${
                      selectedTags.includes(tag.name)
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    <div className="flex gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 space-y-6">
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

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Активные фильтры</h4>
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <X size={14} />
                  Очистить все
                </button>
              </div>

              <div className="space-y-2">
                {/* Active Categories */}
                {selectedCategories.map(cat => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full mr-1 mb-1"
                  >
                    {cat}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}

                {/* Active Tags */}
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full mr-1 mb-1"
                  >
                    #{tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="hover:bg-green-200 dark:hover:bg-green-700 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Filter size={18} />
              Категории
            </h3>
            <div className="space-y-2">
              {allCategories.map(category => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => toggleCategory(category.name)}
                    className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm group-hover:text-blue-600 transition">
                    {category.name}
                  </span>
                  <span className="text-xs text-zinc-400 ml-auto">
                    ({category.article_count})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag size={18} />
                Популярные теги
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 20).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    className={`px-3 py-1 text-xs rounded-full border transition ${
                      selectedTags.includes(tag.name)
                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    #{tag.name} ({tag.article_count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 order-1 lg:order-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-zinc-500">Загружаем статьи...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 text-lg">Статьи не найдены</p>
              {hasActiveFilters && (
                <div className="mt-4">
                  <p className="text-sm text-zinc-400 mb-3">
                    По выбранным фильтрам ничего не найдено
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Results info */}
              <div className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                {hasActiveFilters ? (
                  <p>Найдено {articles.length} статей по фильтрам</p>
                ) : (
                  <p>Показано {articles.length} статей</p>
                )}
              </div>

              {/* Articles grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map(article => {
                  const featuredImage = getArticleImage(article)
                  const hasImageError = imageErrors[article.id]

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
                            onError={() => handleImageError(article.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-zinc-400">
                              <div className="w-12 h-12 bg-zinc-300 dark:bg-zinc-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Tag size={20} />
                              </div>
                              <p className="text-xs">Нет изображения</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Categories and Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {/* Categories */}
                          {article.categories?.slice(0, 2).map(category => (
                            <span
                              key={category}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}

                          {/* Regular Tags */}
                          {article.regular_tags?.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Title */}
                        <h2 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3 line-clamp-3">
                          {truncateText(article.content, 120)}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(article.created_at)}
                            </span>
                            {article.author_name && (
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {article.author_name}
                              </span>
                            )}
                          </div>
                          {article.views && (
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              {article.views}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}