// frontend/src/app/admin/articles/[id]/edit/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ArticleRead } from '@/types/article'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('Новости')
  const [authorName, setAuthorName] = useState('')
  const [gameTitle, setGameTitle] = useState('')

  const editor = useEditor({
    extensions: [StarterKit, Link, Image, Youtube],
    content: ''
  })

  useEffect(() => {
    if (!id) return
    api.get(`/admin/articles/${id}`)
      .then(res => {
        const data: ArticleRead = res.data
        setTitle(data.title)
        setSlug(data.slug)
        setCategory(data.category)
        setAuthorName(data.author_name || '')
        setGameTitle(data.game_title || '')
        editor?.commands.setContent(data.content)
      })
      .finally(() => setLoading(false))
  }, [id, editor])

  const handleUpdate = async () => {
    const content = editor?.getHTML() || ''
    try {
      await api.put(`/admin/articles/${id}`, {
        title,
        slug,
        content,
        category,
        author_name: authorName,
        game_title: gameTitle,
        published: true,
      })
      router.push('/admin/articles')
    } catch (err) {
      console.error('Ошибка при обновлении статьи', err)
    }
  }

  if (loading) return <div className="p-6 text-center">Загрузка...</div>

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Редактирование статьи</h1>

      <input
        type="text"
        placeholder="Заголовок"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Slug (url)"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={slug}
        onChange={e => setSlug(e.target.value)}
      />
      <input
        type="text"
        placeholder="Имя автора"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={authorName}
        onChange={e => setAuthorName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Название игры"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={gameTitle}
        onChange={e => setGameTitle(e.target.value)}
      />

      <select
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option value="Новости">Новости</option>
        <option value="Гайды">Гайды</option>
        <option value="Промокоды">Промокоды</option>
        <option value="Обзоры">Обзоры</option>
        <option value="ПК Игры">ПК Игры</option>
        <option value="Мобильные игры">Мобильные игры</option>
      </select>

      <div className="prose prose-invert bg-zinc-900 rounded p-4 mb-6">
        {editor && <EditorContent editor={editor} />}
      </div>

      <button
        onClick={handleUpdate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Сохранить изменения
      </button>
    </div>
  )
}
