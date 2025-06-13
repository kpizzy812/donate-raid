// frontend/src/app/blog/[slug]/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { notFound } from 'next/navigation'
import { Calendar, User, Tag, Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: number
  slug: string
  title: string
  content: string
  category: string
  created_at: string
  author_name?: string
  featured_image?: string
  tags?: string[]
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles?category=${category}&limit=3`, {
      next: { revalidate: 300 }
    })

    if (!res.ok) return []
    const articles = await res.json()

    // Исключаем текущую статью
    return articles.filter((article: Article) => article.slug !== currentSlug)
  } catch (error) {
    return []
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(params.slug)

  if (!article) {
    return notFound()
  }

  const relatedArticles = await getRelatedArticles(article.category, article.slug)
  const featuredImage = article.featured_image || getImageFromContent(article.content)

  const shareArticle = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: `Читайте статью: ${article.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      // Можно добавить toast уведомление
    }
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
        {/* Featured image */}
        {featuredImage && (
          <div className="aspect-video mb-6 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <img
              src={featuredImage}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Category */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm">
            <Tag size={14} />
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>{article.author_name || 'DonateRaid Team'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <time dateTime={article.created_at}>
              {new Date(article.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>

          <button
            onClick={shareArticle}
            className="flex items-center gap-2 hover:text-blue-600 transition"
            title="Поделиться статьей"
          >
            <Share2 size={16} />
            <span>Поделиться</span>
          </button>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Article content */}
      <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <div
          dangerouslySetInnerHTML={{ __html: article.content }}
          className="leading-relaxed"
        />
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-zinc-200 dark:border-zinc-700 pt-8">
          <h2 className="text-2xl font-bold mb-6">Похожие статьи</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedArticles.map(relatedArticle => {
              const relatedImage = relatedArticle.featured_image || getImageFromContent(relatedArticle.content)

              return (
                <Link
                  key={relatedArticle.id}
                  href={`/blog/${relatedArticle.slug}`}
                  className="group bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-all duration-300"
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
                        <div className="text-2xl">📰</div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                      {relatedArticle.category}
                    </div>
                    <h3 className="font-semibold group-hover:text-blue-600 transition line-clamp-2">
                      {relatedArticle.title}
                    </h3>
                    <div className="text-xs text-zinc-500 mt-2">
                      {new Date(relatedArticle.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Call to action */}
      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950 rounded-xl text-center">
        <h3 className="text-lg font-semibold mb-2">Понравилась статья?</h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Следите за новостями в нашем блоге и не пропускайте полезные материалы
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/blog"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition"
          >
            Читать больше
          </Link>
          <Link
            href="/support"
            className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-2 rounded-md transition"
          >
            Задать вопрос
          </Link>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const article = await getArticle(params.slug)

  if (!article) {
    return {
      title: 'Статья не найдена',
    }
  }

  const description = article.content.replace(/<[^>]*>/g, '').slice(0, 160)
  const featuredImage = article.featured_image || getImageFromContent(article.content)

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      images: featuredImage ? [{ url: featuredImage }] : [],
      type: 'article',
      publishedTime: article.created_at,
      authors: [article.author_name || 'DonateRaid Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: featuredImage ? [featuredImage] : [],
    },
  }
}