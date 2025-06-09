'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import Dropcursor from '@tiptap/extension-dropcursor'
import TextAlign from '@tiptap/extension-text-align'
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon, AlignLeft, AlignCenter, AlignRight, Maximize2 } from 'lucide-react'

export default function CreateArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('Новости')
  const [authorName, setAuthorName] = useState('')
  const [gameTitle, setGameTitle] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      Youtube,
      Placeholder.configure({
        placeholder: 'Начните писать статью...'
      }),
      Dropcursor,
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: '',
    editorProps: {
      handleDrop(view, event, _slice, moved) {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false
        const file = files[0]
        const reader = new FileReader()
        reader.onload = () => {
          const src = reader.result as string
          editor?.chain().focus().setImage({ src }).run()
        }
        reader.readAsDataURL(file)
        return true
      },
      handlePaste(view, event, slice) {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile()
            if (file) {
              const reader = new FileReader()
              reader.onload = () => {
                const src = reader.result as string
                editor?.chain().focus().setImage({ src }).run()
              }
              reader.readAsDataURL(file)
              return true
            }
          }
        }
        return false
      },
      attributes: {
        class: 'min-h-[400px] outline-none'
      }
    }
  })

  const handleSubmit = async () => {
    const content = editor?.getHTML() || ''
    try {
      await api.post('/admin/articles', {
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
      console.error('Ошибка при создании статьи', err)
    }
  }

  const addImage = () => {
    const url = prompt('Вставьте ссылку на изображение')
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }

  const addYoutube = () => {
    const url = prompt('Вставьте ссылку на YouTube-видео')
    if (url) {
      editor?.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }

  return (
    <div className={`w-full ${fullscreen ? 'fixed top-0 left-0 right-0 bottom-0 z-50 bg-zinc-950' : 'min-h-screen'} text-white p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Создание статьи</h1>
        <button onClick={() => setFullscreen(prev => !prev)} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700">
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Заголовок"
          className="p-2 bg-zinc-800 text-white rounded"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Slug (url)"
          className="p-2 bg-zinc-800 text-white rounded"
          value={slug}
          onChange={e => setSlug(e.target.value)}
        />
        <input
          type="text"
          placeholder="Имя автора"
          className="p-2 bg-zinc-800 text-white rounded"
          value={authorName}
          onChange={e => setAuthorName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Название игры (для поиска)"
          className="p-2 bg-zinc-800 text-white rounded"
          value={gameTitle}
          onChange={e => setGameTitle(e.target.value)}
        />
      </div>

      <select
        className="w-full mb-4 p-2 bg-zinc-800 text-white rounded"
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

      {editor && (
        <div className="flex flex-wrap gap-2 mb-2">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><Bold size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><Italic size={18} /></button>
          <button onClick={() => { const url = prompt('Введите ссылку:'); if (url) editor.chain().focus().setLink({ href: url }).run() }} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><LinkIcon size={18} /></button>
          <button onClick={addImage} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><ImageIcon size={18} /></button>
          <button onClick={addYoutube} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><YoutubeIcon size={18} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><AlignLeft size={18} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><AlignCenter size={18} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><AlignRight size={18} /></button>
        </div>
      )}

      <div className="bg-zinc-900 rounded p-4 mb-6 min-h-[400px]">
        {editor && <EditorContent editor={editor} />}
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded"
      >
        Опубликовать статью
      </button>
    </div>
  )
}
