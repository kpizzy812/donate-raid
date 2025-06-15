// frontend/src/app/blog/[slug]/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ С КЛИЕНТСКИМ РЕНДЕРИНГОМ
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, User, Tag, Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getImageUrl } from '@/lib/imageUtils'

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
  tags?: Array<{id: number, name: string, slug: string}>
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

        // Загружаем похожие статьи
        if (articleData.category) {
          try {
            const relatedResponse = await api.get(`/articles?category=${articleData.category}`)
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
        {/* Category badge */}
        <div className="mb-4">
          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
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
            <span>Поделиться</span>
          </button>
        </div>

        {/* Featured image */}
        {featuredImage && (
          <div className="mb-8">
            <img
              src={featuredImage}
              alt={article.title}
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                console.error('Ошибка загрузки изображения статьи:', featuredImage)
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
              >
                <Tag size={12} />
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Article content */}
      <main className="mb-12">
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 prose-strong:text-gray-900 dark:prose-strong:text-gray-100"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </main>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Похожие статьи</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => {
              const relatedImage = getArticleImage(relatedArticle)

              return (
                <Link
                  key={relatedArticle.id}
                  href={`/blog/${relatedArticle.slug}`}
                  className="group block"
                >
                  <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform group-hover:scale-105">
                    {relatedImage && (
                      <img
                        src={relatedImage}
                        alt={relatedArticle.title}
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                        {relatedArticle.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(relatedArticle.created_at)}
                      </p>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}