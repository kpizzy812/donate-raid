// frontend/src/app/blog/[slug]/page.tsx - ОБНОВЛЕННАЯ СТРАНИЦА СТАТЬИ
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, User, Tag, Share2, ArrowLeft, Filter } from 'lucide-react'
import Link from 'next/link'
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
}

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('Загружаем статью с slug:', slug)

        // Загружаем статью
        const response = await api.get(`/articles/${slug}`)
        const articleData = response.data

        console.log('Получена статья:', articleData)
        setArticle(articleData)

        // Загружаем похожие статьи по категориям
        if (articleData.categories && articleData.categories.length > 0) {
          try {
            const relatedResponse = await api.get(`/articles?categories=${articleData.categories[0]}`)
            const related = relatedResponse.data
              .filter((a: Article) => a.slug !== slug)
              .slice(0, 3)
            setRelatedArticles(related)
          } catch (relError) {
            console.warn('Ошибка загрузки похожих статей:', relError)
          }
        }

      } catch (err: any) {
        console.error('Ошибка загрузки статьи:', err)

        if (err.response?.status === 404) {
          setError('Статья не найдена')
        } else {
          setError('Ошибка загрузки статьи')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const getImageFromContent = (content: string) => {
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
    return imgMatch ? imgMatch[1] : null
  }

  const getArticleImage = (article: Article) => {
    const imagePath = article.featured_image_url ||
                     article.featured_image ||
                     getImageFromContent(article.content)

    return imagePath ? getImageUrl(imagePath) : null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title || 'Статья',
        text: `Читайте статью: ${article?.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Ссылка скопирована в буфер обмена!')
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    const plainText = text.replace(/<[^>]*>/g, '')
    return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-500">Загружаем статью...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error || 'Статья не найдена'}
          </h1>
          <p className="text-zinc-600 mb-6">
            Запрашиваемая статья не существует или была удалена
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft size={16} />
            Вернуться к блогу
          </Link>
        </div>
      </div>
    )
  }

  const featuredImage = getArticleImage(article)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
      >
        <ArrowLeft size={16} />
        Вернуться к блогу
      </Link>

      {/* Article header */}
      <header className="mb-8">
        {/* Categories and Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {/* Categories */}
          {article.categories?.map(category => (
            <Link
              key={category}
              href={`/blog?categories=${encodeURIComponent(category)}`}
              className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition"
            >
              <Filter size={12} />
              {category}
            </Link>
          ))}

          {/* Regular Tags */}
          {article.regular_tags?.map(tag => (
            <Link
              key={tag}
              href={`/blog?tags=${encodeURIComponent(tag)}`}
              className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium px-3 py-1 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition"
            >
              <Tag size={12} />
              {tag}
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 text-sm mb-6">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <time dateTime={article.created_at}>
              {formatDate(article.created_at)}
            </time>
          </div>

          {article.author_name && (
            <div className="flex items-center gap-1">
              <User size={16} />
              <span>{article.author_name}</span>
            </div>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition"
          >
            <Share2 size={16} />
            Поделиться
          </button>
        </div>

        {/* Featured image */}
        {featuredImage && (
          <div className="mb-8">
            <img
              src={featuredImage}
              alt={article.title}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}
      </header>

      {/* Article content */}
      <article className="prose prose-lg max-w-none dark:prose-invert mb-12">
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-2xl font-bold mb-6">Похожие статьи</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map(relatedArticle => {
              const relatedImage = getArticleImage(relatedArticle)

              return (
                <Link
                  key={relatedArticle.id}
                  href={`/blog/${relatedArticle.slug}`}
                  className="group bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    {relatedImage ? (
                      <img
                        src={relatedImage}
                        alt={relatedArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-zinc-400">
                          <Tag size={24} className="mx-auto mb-2" />
                          <p className="text-xs">Нет изображения</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Categories */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {relatedArticle.categories?.slice(0, 2).map(category => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {relatedArticle.title}
                    </h3>

                    <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-2">
                      {truncateText(relatedArticle.content, 100)}
                    </p>

                    <div className="mt-2 text-xs text-zinc-500">
                      {formatDate(relatedArticle.created_at)}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}