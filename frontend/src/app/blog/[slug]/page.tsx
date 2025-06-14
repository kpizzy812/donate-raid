// frontend/src/app/blog/[slug]/page.tsx - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
import { notFound } from 'next/navigation'
import { Calendar, User, Tag, Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

interface Article {
  id: number
  slug: string
  title: string
  content: string
  category: string
  created_at: string
  author_name?: string
  featured_image_url?: string  // ИСПРАВЛЕНО: правильное название поля
  tags?: Array<{id: number, name: string, slug: string}>
}

interface ArticlePageProps {
  params: {
    slug: string
  }
}

// Вынесем функцию за пределы компонента, чтобы она была доступна в generateMetadata
function getImageFromContent(content: string) {
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
  return imgMatch ? imgMatch[1] : null
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    // ИСПРАВЛЕНО: правильный путь к API
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/${slug}`, {
      next: { revalidate: 300 } // Кешируем на 5 минут
    })

    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

async function getRelatedArticles(category: string, currentSlug: string): Promise<Article[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles?category=${category}`, {
      next: { revalidate: 300 }
    })

    if (!res.ok) return []
    const articles = await res.json()

    // Исключаем текущую статью и берем только 3
    return articles.filter((article: Article) => article.slug !== currentSlug).slice(0, 3)
  } catch (error) {
    return []
  }
}

// Генерация метаданных для SEO
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticle(params.slug)

  if (!article) {
    return {
      title: 'Статья не найдена',
      description: 'Запрашиваемая статья не найдена'
    }
  }

  const featuredImage = article.featured_image_url || getImageFromContent(article.content)

  return {
    title: article.title,
    description: article.content.replace(/<[^>]*>/g, '').substring(0, 160),
    openGraph: {
      title: article.title,
      description: article.content.replace(/<[^>]*>/g, '').substring(0, 160),
      images: featuredImage ? [featuredImage] : [],
      type: 'article',
      publishedTime: article.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.content.replace(/<[^>]*>/g, '').substring(0, 160),
      images: featuredImage ? [featuredImage] : [],
    }
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(params.slug)

  if (!article) {
    return notFound()
  }

  const relatedArticles = await getRelatedArticles(article.category, article.slug)
  const featuredImage = article.featured_image_url || getImageFromContent(article.content)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
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
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: article.title,
                  text: `Читайте статью: ${article.title}`,
                  url: window.location.href,
                })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Ссылка скопирована в буфер обмена!')
              }
            }}
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
            />
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
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
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </main>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Похожие статьи</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/blog/${relatedArticle.slug}`}
                className="group block"
              >
                <article className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:scale-105">
                  {relatedArticle.featured_image_url && (
                    <img
                      src={relatedArticle.featured_image_url}
                      alt={relatedArticle.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                      {relatedArticle.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(relatedArticle.created_at)}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}