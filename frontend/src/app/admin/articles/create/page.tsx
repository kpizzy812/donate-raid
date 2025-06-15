// frontend/src/app/admin/articles/create/page.tsx - ФИНАЛЬНАЯ ВЕРСИЯ С НОВОЙ СИСТЕМОЙ
'use client'

import { useState, useEffect } from 'react'
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
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import {
  Bold, Italic, Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon,
  AlignLeft, AlignCenter, AlignRight, Maximize2, Upload, Plus, X, Highlighter, Filter, Tag
} from 'lucide-react'

interface CategoryInfo {
  name: string
  slug: string
  color: string
}

interface TagInfo {
  name: string
  slug: string
  color: string
}

export default function CreateArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Новости'])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [authorName, setAuthorName] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [newTag, setNewTag] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  // Загруженные категории и теги
  const [availableCategories, setAvailableCategories] = useState<CategoryInfo[]>([])
  const [availableTags, setAvailableTags] = useState<TagInfo[]>([])

  const defaultCategories = ['Новости', 'Гайды', 'Промокоды', 'Обзоры', 'ПК Игры', 'Мобильные игры']

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

  // Загружаем доступные категории и теги
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          api.get('/admin/articles/categories/available'),
          api.get('/admin/articles/tags/available')
        ])
        setAvailableCategories(categoriesRes.data)
        setAvailableTags(tagsRes.data)
      } catch (error) {
        console.error('Ошибка загрузки опций:', error)
        // Используем стандартные категории как fallback
        setAvailableCategories(defaultCategories.map(name => ({ name, slug: name.toLowerCase(), color: '#3B82F6' })))
      }
    }
    loadOptions()
  }, [])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
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

  const addCustomTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Введите заголовок статьи')
      return
    }

    if (!slug.trim()) {
      alert('Введите slug для статьи')
      return
    }

    if (selectedCategories.length === 0) {
      alert('Выберите хотя бы одну категорию')
      return
    }

    const content = editor?.getHTML() || ''

    try {
      const requestData = {
        title: title.trim(),
        slug: slug.trim(),
        content,
        categories: selectedCategories, // Множественные категории
        author_name: authorName.trim() || 'DonateRaid Team',
        featured_image: featuredImage,
        tags: selectedTags, // Обычные теги
        published: true,
      }

      console.log('Отправляем данные:', requestData)

      await api.post('/admin/articles', requestData)

      alert('Статья успешно создана!')
      router.push('/admin/articles')
    } catch (err: any) {
      console.error('Ошибка при создании статьи', err)

      if (err.response) {
        console.error('Статус ошибки:', err.response.status)
        console.error('Данные ошибки:', err.response.data)
        alert(`Ошибка при создании статьи: ${err.response.data.detail || err.response.statusText}`)
      } else {
        alert('Ошибка при создании статьи')
      }
    }
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

  const allCategories = availableCategories.length > 0 ? availableCategories : defaultCategories.map(name => ({ name, slug: name.toLowerCase(), color: '#3B82F6' }))

  return (
    <div className={`w-full ${fullscreen ? 'fixed top-0 left-0 right-0 bottom-0 z-50 bg-zinc-950' : 'min-h-screen'} text-white p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Создание статьи</h1>
        <button
          onClick={() => setFullscreen(prev => !prev)}
          className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"
          title="Полноэкранный режим"
        >
          <Maximize2 size={18} />
        </button>
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
              onChange={e => {
                setTitle(e.target.value)
                if (!slug) setSlug(generateSlug(e.target.value))
              }}
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
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Filter size={16} />
              Категории *
              <span className="text-xs text-zinc-400 font-normal">(статья попадет во все выбранные)</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {allCategories.map(category => (
                <label key={category.name} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => toggleCategory(category.name)}
                    className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{category.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Выбрано: {selectedCategories.length} категорий
            </p>
          </div>

          {/* Теги */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Tag size={16} />
              Теги
              <span className="text-xs text-zinc-400 font-normal">(для поиска и детализации)</span>
            </label>

            {/* Популярные теги */}
            {availableTags.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-zinc-400 mb-2">Популярные теги:</p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {availableTags.slice(0, 15).map(tag => (
                    <button
                      key={tag.name}
                      onClick={() => toggleTag(tag.name)}
                      className={`px-2 py-1 text-xs rounded-full border transition ${
                        selectedTags.includes(tag.name)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-zinc-700 text-zinc-300 border-zinc-600 hover:bg-zinc-600'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Добавление нового тега */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Новый тег"
                className="flex-1 p-2 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
              />
              <button
                onClick={addCustomTag}
                className="p-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Выбранные теги */}
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-green-700 rounded text-xs">
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
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium"
        >
          Опубликовать статью
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