// frontend/src/app/admin/products/create/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react'
import { SmartSortSelector } from '@/components/admin/SmartSortSelector'
import { useProductsForSorting, getNextSortOrder } from '@/hooks/useSortableItems'

interface Game {
  id: number
  name: string
}

interface GameSubcategory {
  id: number
  game_id: number
  name: string
  description?: string
  sort_order: number
  enabled: boolean
}

interface InputField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea'
  required: boolean
  placeholder?: string
  help_text?: string
  options?: string[]
  validation_regex?: string
  min_length?: number
  max_length?: number
}

export default function CreateProductPage() {
  const router = useRouter()

  // Основные поля
  const [games, setGames] = useState<Game[]>([])
  const [gameSubcategories, setGameSubcategories] = useState<GameSubcategory[]>([]) // ДОБАВЛЕНО
  const [gameId, setGameId] = useState<number>(0)
  const [name, setName] = useState('')
  const [priceRub, setPriceRub] = useState<number>(0)
  const [oldPriceRub, setOldPriceRub] = useState<number | null>(null)
  const [minAmount, setMinAmount] = useState<number>(1)
  const [maxAmount, setMaxAmount] = useState<number>(1)
  const [type, setType] = useState<'currency' | 'item' | 'service'>('currency')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [delivery, setDelivery] = useState('auto')
  const [sortOrder, setSortOrder] = useState<number>(0)
  const { products: existingProducts, loading: productsLoading } = useProductsForSorting(gameId)
  const [enabled, setEnabled] = useState(true)

  // ИСПРАВЛЕНО: Используем subcategory_id вместо subcategory
  const [specialNote, setSpecialNote] = useState('')
  const [noteType, setNoteType] = useState('warning')
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null) // ИЗМЕНЕНО
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  // Настраиваемые поля
  const [inputFields, setInputFields] = useState<InputField[]>([])

  useEffect(() => {
    loadGames()
  }, [])

  // ДОБАВЛЕНО: Загружаем подкатегории при выборе игры
  useEffect(() => {
    if (gameId > 0) {
      loadGameSubcategories(gameId)
    } else {
      setGameSubcategories([])
      setSubcategoryId(null)
    }
  }, [gameId])

  useEffect(() => {
  if (!productsLoading && gameId && sortOrder === 0) {
    setSortOrder(getNextSortOrder(existingProducts))
  }
}, [productsLoading, existingProducts, gameId, sortOrder])

  const loadGames = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setGames(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки игр:', error)
    }
  }

  // ДОБАВЛЕНО: Загрузка подкатегорий игры
  const loadGameSubcategories = async (gameId: number) => {
    console.log(`🔍 Загружаем подкатегории для игры ${gameId}`)

    try {
      const token = localStorage.getItem('access_token')
      console.log('🔑 Токен:', token ? 'найден' : 'НЕ НАЙДЕН')

      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${gameId}`
      console.log('🌐 URL запроса:', url)

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      console.log('📡 Ответ статус:', response.status)
      console.log('📡 Ответ заголовки:', response.headers)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Полученные подкатегории:', data)
        console.log('📊 Количество подкатегорий:', data.length)
        setGameSubcategories(data)

        if (data.length === 0) {
          console.log('⚠️ ВНИМАНИЕ: API вернул пустой массив подкатегорий')
          alert('❌ У этой игры нет подкатегорий или они не загрузились. Проверьте:\n1. Созданы ли подкатегории для этой игры\n2. Работает ли бэкенд\n3. Подключен ли роутер subcategories')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Ошибка HTTP:', response.status, errorText)
        alert(`❌ Ошибка ${response.status}: ${errorText}`)
        setGameSubcategories([])
      }
    } catch (error) {
      console.error('❌ Ошибка сети при загрузке подкатегорий:', error)
      alert(`❌ Сетевая ошибка: ${error}`)
      setGameSubcategories([])
    }
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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subfolder', 'products')

      const token = localStorage.getItem('access_token')
      // ИСПРАВЛЕНО: Правильный путь /upload/admin/image вместо /admin/upload/image
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/admin/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки')
      }

      const data = await response.json()
      if (data.success) {
        setImageUrl(data.file_url)
      } else {
        throw new Error('Неожиданный ответ сервера')
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error)
      alert('Ошибка загрузки изображения')
    } finally {
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

  const removeImage = () => {
    setImageUrl('')
  }

  const addInputField = () => {
    setInputFields([...inputFields, {
      name: '',
      label: '',
      type: 'text',
      required: true,
      placeholder: '',
      help_text: ''
    }])
  }

  const removeInputField = (index: number) => {
    setInputFields(inputFields.filter((_, i) => i !== index))
  }

  const updateInputField = (index: number, field: keyof InputField, value: any) => {
    const updated = [...inputFields]
    updated[index] = { ...updated[index], [field]: value }
    setInputFields(updated)
  }

  const handleSubmit = async () => {
    // ИСПРАВЛЕНО: Валидация обязательных полей
    if (!gameId || !name.trim() || priceRub <= 0) {
      alert('Заполните обязательные поля: игра, название, цена')
      return
    }

    try {
      // ИСПРАВЛЕНО: Отправляем правильные поля
      const productData = {
        game_id: gameId,
        name: name.trim(),
        price_rub: priceRub,
        old_price_rub: oldPriceRub,
        min_amount: minAmount,
        max_amount: maxAmount,
        type,
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        enabled,
        delivery,
        sort_order: sortOrder,
        input_fields: inputFields,
        special_note: specialNote.trim() || null,
        note_type: noteType,
        subcategory_id: subcategoryId, // ИСПРАВЛЕНО: используем subcategory_id
        image_url: imageUrl || null
      }

      console.log('🚀 Отправляем данные товара:', productData)

      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Ошибка создания товара')
      }

      alert('Товар успешно создан!')
      router.push('/admin/products')
    } catch (error: any) {
      console.error('Ошибка создания товара:', error)
      alert(`Ошибка создания товара: ${error.message}`)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Создание товара</h1>

      <div className="space-y-6">
        {/* Основная информация */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Игра *</label>
              <select
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={gameId}
                onChange={e => setGameId(Number(e.target.value))}
              >
                <option value={0}>Выберите игру</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            </div>

            {/* ДОБАВЛЕНО: Выбор подкатегории */}
            <div>
              <label className="block text-sm font-medium mb-2">Подкатегория</label>
              <select
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={subcategoryId || ''}
                onChange={e => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
                disabled={!gameId}
              >
                <option value="">Без подкатегории</option>
                {gameSubcategories
                  .filter(sub => sub.enabled)
                  .map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
              </select>
              {!gameId && (
                <p className="text-xs text-zinc-500 mt-1">Сначала выберите игру</p>
              )}
              {gameId && gameSubcategories.length === 0 && (
                <p className="text-xs text-zinc-500 mt-1">
                  У этой игры нет подкатегорий. Создайте их в настройках игры.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название товара *</label>
              <input
                type="text"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Название товара"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Цена (₽) *</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={priceRub}
                onChange={e => setPriceRub(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Старая цена (₽)</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={oldPriceRub || ''}
                onChange={e => setOldPriceRub(e.target.value ? Number(e.target.value) : null)}
                placeholder="Для зачеркивания"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Тип товара *</label>
              <select
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={type}
                onChange={e => setType(e.target.value as 'currency' | 'item' | 'service')}
              >
                <option value="currency">💰 Валюта</option>
                <option value="item">📦 Предмет</option>
                <option value="service">🔧 Услуга</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Мин. количество</label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={minAmount}
                onChange={e => setMinAmount(Number(e.target.value))}
              />
            </div>
            <div className="mb-4">
              <SmartSortSelector
                label="Позиция среди товаров игры"
                items={existingProducts}
                value={sortOrder}
                onChange={setSortOrder}
                placeholder="Выберите где разместить товар"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Макс. количество</label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={maxAmount}
                onChange={e => setMaxAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Описание товара</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Краткое описание товара..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Инструкции</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Подробные инструкции для товара..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Особая пометка</label>
              <input
                type="text"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={specialNote}
                onChange={e => setSpecialNote(e.target.value)}
                placeholder="Не подходит для РУ аккаунта, Хит продаж..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Тип пометки</label>
              <select
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={noteType}
                onChange={e => setNoteType(e.target.value)}
              >
                <option value="warning">⚠️ Предупреждение (желтый)</option>
                <option value="info">ℹ️ Информация (синий)</option>
                <option value="success">✅ Успех (зеленый)</option>
                <option value="error">❌ Ошибка (красный)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm">Активен (отображается на сайте)</label>
          </div>
        </div>

        {/* Изображение товара */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Изображение товара</h2>

          {imageUrl ? (
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="Изображение товара"
                className="w-48 h-32 object-cover rounded border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleImageUpload}
              disabled={imageUploading}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg p-8 w-full text-center transition-colors disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                {imageUploading ? (
                  <Upload className="w-8 h-8 text-zinc-400 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                )}
                <span className="text-zinc-600 dark:text-zinc-400">
                  {imageUploading ? 'Загрузка...' : 'Нажмите для загрузки изображения'}
                </span>
                <span className="text-xs text-zinc-500">JPG, PNG, GIF. Макс. 5MB</span>
              </div>
            </button>
          )}
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
            Создать товар
          </button>
        </div>
      </div>
    </div>
  )
}