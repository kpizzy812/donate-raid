// frontend/src/app/admin/articles/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ArticleRead } from '@/types/article'

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleRead[]>([])
  const router = useRouter()

  useEffect(() => {
    api.get('/admin/articles')
      .then(res => setArticles(res.data))
      .catch(err => console.error('Ошибка загрузки статей', err))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить статью?')) return
    try {
      await api.delete(`/admin/articles/${id}`)
      setArticles(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Ошибка удаления статьи', err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Статьи</h1>
        <Link href="/admin/articles/create" className="bg-green-600 text-white px-4 py-2 rounded">
          + Новая статья
        </Link>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-700">
          <tr>
            <th className="py-2">ID</th>
            <th>Заголовок</th>
            <th>Категория</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {articles.map(article => (
            <tr key={article.id} className="border-b border-zinc-800 hover:bg-zinc-800">
              <td className="py-2 pr-2">{article.id}</td>
              <td>{article.title}</td>
              <td>{article.category}</td>
              <td>{new Date(article.created_at).toLocaleDateString()}</td>
              <td className="text-right space-x-2">
                <Link href={`/admin/articles/${article.id}/edit`} className="text-blue-500 hover:underline">
                  Редактировать
                </Link>
                <button onClick={() => handleDelete(article.id)} className="text-red-500 hover:underline">
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
