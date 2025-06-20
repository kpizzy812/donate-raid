// frontend/src/app/admin/games/create/page.tsx - С УПРАВЛЕНИЕМ ПОДКАТЕГОРИЯМИ
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

interface Subcategory {
  name: string
  description: string
  sort_order: number
  enabled: boolean
}

export default function CreateGamePage() {
  const router = useRouter()

  // Состояния формы
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [faq, setFaq] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [subcategoryDescription, setSubcategoryDescription] = useState('')
  const [autoSupport, setAutoSupport] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)

  // ДОБАВЛЕНО: Управление подкатегориями
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])

  // Состояния загрузки
  const [bannerUploading, setBannerUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  // Функции загрузки изображений (исправленные пути)
  const uploadBanner = async (file: File) => {
    setBannerUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('subfolder', 'games')

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/admin/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) throw new Error('Ошибка загрузки')

      const data = await response.json()
      if (data.success) {
        setBannerUrl(data.file_url)
      } else {
        throw new Error('Неожиданный ответ сервера')
      }
    } catch (error) {
      console.error('Ошибка загрузки баннера:', error)
      alert('Ошибка загрузки баннера')
    } finally {
      setBannerUploading(false)
    }
  }

  const uploadLogo = async (file: File) => {
    setLogoUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('subfolder', 'games')

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/admin/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) throw new Error('Ошибка загрузки')

      const data = await response.json()
      if (data.success) {
        setLogoUrl(data.file_url)
      } else {
        throw new Error('Неожиданный ответ сервера')
      }
    } catch (error) {
      console.error('Ошибка загрузки лого:', error)
      alert('Ошибка загрузки лого')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleBannerUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) uploadBanner(file)
    }
    input.click()
  }

  const handleLogoUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) uploadLogo(file)
    }
    input.click()
  }

  // ДОБАВЛЕНО: Функции управления подкатегориями
  const addSubcategory = () => {
    setSubcategories([...subcategories, {
      name: '',
      description: '',
      sort_order: subcategories.length,
      enabled: true
    }])
  }

  const updateSubcategory = (index: number, field: keyof Subcategory, value: any) => {
    const updated = [...subcategories]
    updated[index] = { ...updated[index], [field]: value }
    setSubcategories(updated)
  }

  const removeSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index))
  }

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
    const baseUrl = apiUrl.replace('/api', '')
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Введите название игры')
      return
    }

    try {
      // Сначала создаем игру
      const gameData = {
        name: name.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        faq_content: faq.trim() || null,
        banner_url: bannerUrl || null,
        logo_url: logoUrl || null,
        subcategory_description: subcategoryDescription.trim() || null,
        auto_support: autoSupport,
        enabled,
        sort_order: sortOrder
      }

      console.log('Отправляем данные игры:', gameData)

      const token = localStorage.getItem('access_token')
      const gameResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
      })

      if (!gameResponse.ok) {
        const errorData = await gameResponse.json()
        throw new Error(errorData.detail || 'Ошибка создания игры')
      }

      const createdGame = await gameResponse.json()
      const gameId = createdGame.id

      // Затем создаем подкатегории
      for (const subcategory of subcategories) {
        if (subcategory.name.trim()) {
          const subcategoryData = {
            game_id: gameId,
            name: subcategory.name.trim(),
            description: subcategory.description.trim() || null,
            sort_order: subcategory.sort_order,
            enabled: subcategory.enabled
          }

          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${gameId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subcategoryData)
          })
        }
      }

      alert('Игра и подкатегории успешно созданы!')
      router.push('/admin/games')
    } catch (error: any) {
      console.error('Ошибка создания игры:', error)
      alert(`Ошибка создания игры: ${error.message}`)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Создание игры</h1>

      <div className="space-y-6">
        {/* Основная информация */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название игры *</label>
              <input
                type="text"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Название игры"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Порядок сортировки</label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Описание игры</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Краткое описание игры для отображения на карточке..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Описание подкатегорий</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={subcategoryDescription}
              onChange={e => setSubcategoryDescription(e.target.value)}
              placeholder="Объяснение системы подкатегорий (регионов) для пользователей..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoSupport"
                checked={autoSupport}
                onChange={e => setAutoSupport(e.target.checked)}
                className="w-5 h-5"
              />
              <label htmlFor="autoSupport" className="text-sm">
                Автоматическая поддержка
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="w-5 h-5"
              />
              <label htmlFor="enabled" className="text-sm">
                Включена
              </label>
            </div>
          </div>
        </div>

        {/* ДОБАВЛЕНО: Управление подкатегориями */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Подкатегории (регионы)</h2>
            <button
              onClick={addSubcategory}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить подкатегорию
            </button>
          </div>

          {subcategories.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
              Подкатегории позволят разделить товары по регионам (например: Россия, Глобал, Индонезия)
            </p>
          )}

          {subcategories.map((subcategory, index) => (
            <div key={index} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Подкатегория #{index + 1}</h4>
                <button
                  onClick={() => removeSubcategory(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Название *</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                    value={subcategory.name}
                    onChange={e => updateSubcategory(index, 'name', e.target.value)}
                    placeholder="Россия, Глобал, Индонезия..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Порядок сортировки</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                    value={subcategory.sort_order}
                    onChange={e => updateSubcategory(index, 'sort_order', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Описание</label>
                <input
                  type="text"
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                  value={subcategory.description}
                  onChange={e => updateSubcategory(index, 'description', e.target.value)}
                  placeholder="Дополнительная информация о подкатегории..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subcategory.enabled}
                  onChange={e => updateSubcategory(index, 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-sm">Включена</label>
              </div>
            </div>
          ))}
        </div>

        {/* Логотип игры */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Логотип игры (квадратная картинка)</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Квадратное изображение для отображения на главной странице и в карточке игры
          </p>

          {logoUrl ? (
            <div className="relative inline-block">
              <img
                src={getImageUrl(logoUrl)}
                alt="Логотип игры"
                className="w-32 h-32 object-cover rounded-lg border border-zinc-300 dark:border-zinc-600"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
              <button
                onClick={() => setLogoUrl('')}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogoUpload}
              disabled={logoUploading}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg p-8 w-48 h-48 text-center transition-colors disabled:opacity-50 flex flex-col items-center justify-center"
            >
              {logoUploading ? (
                <Upload className="w-8 h-8 text-zinc-400 animate-spin mb-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
              )}
              <span className="text-zinc-600 dark:text-zinc-400 text-sm">
                {logoUploading ? 'Загрузка...' : 'Нажмите для загрузки лого'}
              </span>
            </button>
          )}
        </div>

        {/* Баннер игры */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Баннер игры</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Широкое изображение для отображения на странице игры
          </p>

          {bannerUrl ? (
            <div className="relative inline-block">
              <img
                src={getImageUrl(bannerUrl)}
                alt="Баннер игры"
                className="w-full max-w-md h-32 object-cover rounded border border-zinc-300 dark:border-zinc-600"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
              <button
                onClick={() => setBannerUrl('')}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleBannerUpload}
              disabled={bannerUploading}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg p-8 w-full text-center transition-colors disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                {bannerUploading ? (
                  <Upload className="w-8 h-8 text-zinc-400 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                )}
                <span className="text-zinc-600 dark:text-zinc-400">
                  {bannerUploading ? 'Загрузка...' : 'Нажмите для загрузки баннера'}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Инструкции и FAQ */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Контент</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Инструкции</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={5}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Подробные инструкции для игры..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">FAQ (JSON формат)</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={6}
              value={faq}
              onChange={e => setFaq(e.target.value)}
              placeholder={`[{"question": "Вопрос 1", "answer": "Ответ 1"}, {"question": "Вопрос 2", "answer": "Ответ 2"}]`}
            />
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-zinc-500 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Создать игру
          </button>
        </div>
      </div>
    </div>
  )
}