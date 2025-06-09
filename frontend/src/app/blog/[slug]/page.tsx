// frontend/src/app/blog/[slug]/page.tsx

import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { ArticleRead } from '@/types/article'

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  let article: ArticleRead | null = null

  try {
    const res = await api.get(`/articles/${params.slug}`)
    article = res.data
  } catch (e) {
    return notFound()
  }

  return (
    <div className="prose prose-invert max-w-3xl mx-auto py-10">
      <h1>{article.title}</h1>
      <p className="text-sm text-zinc-400">
        {article.category} • {new Date(article.created_at).toLocaleDateString()} • Автор: {article.author_name || 'Неизвестен'}
      </p>
      <hr className="my-4 border-zinc-700" />
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </div>
  )
}
