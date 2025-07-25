// frontend/src/app/admin/articles/[id]/edit/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
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
import Placeholder from '@tiptap/extension-placeholder'
import Dropcursor from '@tiptap/extension-dropcursor'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import {
  Bold, Italic, Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon,
  AlignLeft, AlignCenter, AlignRight, Upload, Plus, X, Highlighter
} from 'lucide-react'

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [categories, setCategories] = useState<string[]>(['Новости'])
  const [authorName, setAuthorName] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  const allCategories = ['Новости', 'Гайды', 'Промокоды', 'Обзоры', 'ПК Игры', 'Мобильные игры']

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      Youtube,
      Placeholder.configure({
        placeholder: 'Редактируйте содержимое статьи...'
      }),
      Dropcursor,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TextStyle
    ],
    content: '',
    editorProps: {
      handleDrop(view, event, _slice, moved) {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const file = files[0]
        if (file.type.startsWith('image/')) {
          uploadImage(file)
          return true
        }
        return false
      },
      handlePaste(view, event, slice) {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile()
            if (file) {
              uploadImage(file)
              return true
            }
          }
        }
        return false
      },
      attributes: {
        class: 'min-h-[400px] outline-none p-4 prose prose-lg max-w-none'
      }
    }
  })

  useEffect(() => {
    if (!id) return

    const loadArticle = async () => {
      try {
        const res = await api.get(`/admin/articles/${id}`)
        const data: ArticleRead = res.data

        setTitle(data.title)
        setSlug(data.slug)

        // ИСПРАВЛЕНО: Обрабатываем категории и теги
        const mainCategory = data.category || 'Новости'
        const articleTags = data.tags || []

        // Разделяем теги на категории и обычные теги
        const tagNames = articleTags.map(tag => typeof tag === 'string' ? tag : tag.name)
        const categoryTags = tagNames.filter(tag => allCategories.includes(tag))
        const regularTags = tagNames.filter(tag => !allCategories.includes(tag))

        // Основная категория + категории из тегов
        const allCategoriesForArticle = [mainCategory, ...categoryTags.filter(cat => cat !== mainCategory)]
        setCategories(allCategoriesForArticle)
        setTags(regularTags)

        setAuthorName(data.author_name || '')
        setFeaturedImage(data.featured_image || data.featured_image_url || '')
        editor?.commands.setContent(data.content)
      } catch (error) {
        console.error('Ошибка загрузки статьи:', error)
        alert('Ошибка загрузки статьи')
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [id, editor])

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Размер файла не должен превышать 20MB')
      return
    }

    setImageUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = () => {
        const src = reader.result as string
        editor?.chain().focus().setImage({ src }).run()
        setImageUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error)
      alert('Ошибка загрузки изображения')
      setImageUploading(false)
    }
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) uploadImage(file)
    }
    input.click()
  }

  const addFeaturedImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          setFeaturedImage(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const toggleCategory = (category: string) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const addYoutube = () => {
    const url = prompt('Вставьте ссылку на YouTube-видео')
    if (url) {
      editor?.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = prompt('Введите ссылку:')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  const handleUpdate = async () => {
    if (!title.trim()) {
      alert('Введите заголовок статьи')
      return
    }

    if (!slug.trim()) {
      alert('Введите slug для статьи')
      return
    }

    if (categories.length === 0) {
      alert('Выберите хотя бы одну категорию')
      return
    }

    const content = editor?.getHTML() || ''

    try {
      // ИСПРАВЛЕНО: Объединяем обычные теги с дополнительными категориями
      const allTags = [...tags]
      if (categories.length > 1) {
        // Добавляем дополнительные категории как теги
        allTags.push(...categories.slice(1))
      }

      await api.put(`/admin/articles/${id}`, {
        title: title.trim(),
        slug: slug.trim(),
        content,
        category: categories[0], // Основная категория
        categories, // Отправляем все категории
        author_name: authorName.trim() || 'DonateRaid Team',
        featured_image: featuredImage,
        tags: allTags,
        published: true,
      })

      router.push('/admin/articles')
    } catch (err) {
      console.error('Ошибка при обновлении статьи', err)
      alert('Ошибка при обновлении статьи')
    }
  }

  if (loading) return <div className="p-6 text-center">Загрузка...</div>

  return (
    <div className="w-full min-h-screen text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Редактирование статьи</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Заголовок *</label>
            <input
              type="text"
              placeholder="Заголовок статьи"
              className="w-full p-3 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-blue-500 focus:outline-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug (URL) *</label>
            <input
              type="text"
              placeholder="slug-dlya-stati"
              className="w-full p-3 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-blue-500 focus:outline-none"
              value={slug}
              onChange={e => setSlug(e.target.value)}
            />
            <p className="text-xs text-zinc-400 mt-1">
              URL статьи: /blog/{slug || 'slug-dlya-stati'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Автор</label>
            <input
              type="text"
              placeholder="Имя автора"
              className="w-full p-3 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-blue-500 focus:outline-none"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
            />
          </div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Главное изображение */}
          <div>
            <label className="block text-sm font-medium mb-2">Главное изображение</label>
            {featuredImage ? (
              <div className="relative">
                <img src={featuredImage} alt="Превью" className="w-full h-48 object-cover rounded" />
                <button
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={addFeaturedImage}
                className="w-full h-48 border-2 border-dashed border-zinc-600 rounded flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
              >
                <Upload size={24} className="mb-2" />
                <span>Загрузить изображение</span>
              </button>
            )}
          </div>

          {/* Категории */}
          <div>
            <label className="block text-sm font-medium mb-2">Категории *</label>
            <div className="grid grid-cols-1 gap-2">
              {allCategories.map(category => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Первая выбранная категория станет основной
            </p>
          </div>

          {/* Теги */}
          <div>
            <label className="block text-sm font-medium mb-2">Теги</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Новый тег"
                className="flex-1 p-2 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                onClick={addTag}
                className="p-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-zinc-700 rounded text-xs">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="text-red-400 hover:text-red-300">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Панель редактора */}
      {editor && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-zinc-900 rounded">
          <button onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded ${editor.isActive('bold') ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Bold size={18} />
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded ${editor.isActive('italic') ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Italic size={18} />
          </button>
          <button onClick={() => editor.chain().focus().toggleHighlight().run()}
                  className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Highlighter size={18} />
          </button>

          <div className="w-px bg-zinc-700 mx-1"></div>

          <button onClick={addLink} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700">
            <LinkIcon size={18} />
          </button>
          <button onClick={handleImageUpload} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700" disabled={imageUploading}>
            <ImageIcon size={18} />
          </button>
          <button onClick={addYoutube} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700">
            <YoutubeIcon size={18} />
          </button>

          <div className="w-px bg-zinc-700 mx-1"></div>

          <button onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={`p-2 rounded ${editor.isActive({textAlign: 'left'}) ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <AlignLeft size={18} />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={`p-2 rounded ${editor.isActive({textAlign: 'center'}) ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <AlignCenter size={18} />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={`p-2 rounded ${editor.isActive({textAlign: 'right'}) ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <AlignRight size={18} />
          </button>
        </div>
      )}

      {/* Редактор */}
      <div className="bg-zinc-900 rounded p-4 mb-6 min-h-[400px] border border-zinc-700">
        {editor && <EditorContent editor={editor} />}
        {imageUploading && (
          <div className="text-center text-zinc-400 text-sm">
            Загрузка изображения...
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex gap-4">
        <button
          onClick={handleUpdate}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium"
        >
          Сохранить изменения
        </button>
        <button
          onClick={() => router.back()}
          className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}