// frontend/src/app/admin/products/[id]/edit/page.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОДКАТЕГОРИЯМИ
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react'

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

interface Product {
  id: number
  game_id: number
  name: string
  price_rub: number
  old_price_rub?: number
  min_amount: number
  max_amount: number
  type: 'currency' | 'item' | 'service'
  description?: string
  instructions?: string
  enabled: boolean
  delivery: string
  sort_order: number
  input_fields?: InputField[]
  special_note?: string
  note_type: string
  subcategory?: string  // Старое поле для совместимости
  subcategory_id?: number  // Новое поле
  image_url?: string
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const productId = parseInt(params.id)

  // Состояния
  const [games, setGames] = useState<Game[]>([])
  const [gameSubcategories, setGameSubcategories] = useState<GameSubcategory[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  // Поля формы
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
  const [enabled, setEnabled] = useState(true)
  const [specialNote, setSpecialNote] = useState('')
  const [noteType, setNoteType] = useState('warning')
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    loadGames()
    loadProduct()
  }, [productId])

  useEffect(() => {
    if (gameId > 0) {
      loadGameSubcategories(gameId)
    }
  }, [gameId])

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

  const loadGameSubcategories = async (gameId: number) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${gameId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setGameSubcategories(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки подкатегорий:', error)
      setGameSubcategories([])
    }
  }

  const loadProduct = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Товар не найден')
      }

      const productData = await response.json()
      setProduct(productData)

      // Заполняем форму
      setGameId(productData.game_id)
      setName(productData.name)
      setPriceRub(productData.price_rub)
      setOldPriceRub(productData.old_price_rub)
      setMinAmount(productData.min_amount)
      setMaxAmount(productData.max_amount)
      setType(productData.type)
      setDescription(productData.description || '')
      setInstructions(productData.instructions || '')
      setDelivery(productData.delivery)
      setSortOrder(productData.sort_order)
      setEnabled(productData.enabled)
      setSpecialNote(productData.special_note || '')
      setNoteType(productData.note_type || 'warning')
      setSubcategoryId(productData.subcategory_id || null)
      setImageUrl(productData.image_url || '')

    } catch (error) {
      console.error('Ошибка загрузки товара:', error)
      alert('Ошибка загрузки товара')
      router.push('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !gameId || !priceRub) {
      alert('Заполните все обязательные поля')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('access_token')

      const updateData = {
        game_id: gameId,
        name: name.trim(),
        price_rub: priceRub,
        old_price_rub: oldPriceRub,
        min_amount: minAmount,
        max_amount: maxAmount,
        type,
        description,
        instructions,
        enabled,
        delivery,
        sort_order: sortOrder,

        special_note: specialNote.trim() || null,
        note_type: noteType,
        subcategory_id: subcategoryId,  // Используем subcategory_id вместо subcategory
        image_url: imageUrl
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Ошибка обновления товара')
      }

      alert('Товар успешно обновлен!')
      router.push('/admin/products')
    } catch (error: any) {
      console.error('Ошибка обновления товара:', error)
      alert(`Ошибка обновления товара: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImageUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subfolder', 'products')

      const token = localStorage.getItem('access_token')
      // ИСПРАВЛЕНО: Используем правильный путь /upload/admin/image
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/admin/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения')
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


  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Редактирование товара</h1>
        <button
          onClick={() => router.push('/admin/products')}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Назад к списку
        </button>
      </div>

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
            <div>
              <label className="block text-sm font-medium mb-2">Тип товара *</label>
              <select
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={type}
                onChange={e => setType(e.target.value as 'currency' | 'item' | 'service')}
              >
                <option value="currency">Валюта (золото, кристаллы)</option>
                <option value="item">Предмет (шмотки, ключи)</option>
                <option value="service">Услуга (услуги буста и т.п.)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название товара *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                placeholder="Например: 1000 кристаллов"
              />
            </div>
            {/* ОБНОВЛЕНО: Выбор подкатегории вместо текстового поля */}
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
              <label className="block text-sm font-medium mb-2">Цена (₽) *</label>
              <input
                type="number"
                step="0.01"
                value={priceRub}
                onChange={e => setPriceRub(Number(e.target.value))}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Старая цена (₽)</label>
              <input
                type="number"
                step="0.01"
                value={oldPriceRub || ''}
                onChange={e => setOldPriceRub(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                placeholder="Для зачеркивания"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Порядок сортировки</label>
              <input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value))}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Мин. количество</label>
              <input
                type="number"
                step="0.01"
                value={minAmount}
                onChange={e => setMinAmount(Number(e.target.value))}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Макс. количество</label>
              <input
                type="number"
                step="0.01"
                value={maxAmount}
                onChange={e => setMaxAmount(Number(e.target.value))}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Подробное описание товара..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Инструкции</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Инструкции для покупателя..."
            />
          </div>
        </div>

        {/* Картинка товара */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Картинка товара</h2>

          {imageUrl ? (
            <div className="flex items-start gap-4">
              <img
                src={imageUrl}
                alt="Картинка товара"
                className="w-32 h-32 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
              />
              <div className="flex-1">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  Текущая картинка загружена
                </p>
                <button
                  onClick={() => setImageUrl('')}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Удалить картинку
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-6 text-center">
              <ImageIcon className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Загрузите картинку товара
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                {imageUploading ? 'Загрузка...' : 'Выбрать файл'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Особые пометки */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Особые пометки</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Текст пометки</label>
              <input
                type="text"
                value={specialNote}
                onChange={e => setSpecialNote(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Не подходит для РУ аккаунта"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Тип пометки</label>
              <select
                value={noteType}
                onChange={e => setNoteType(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="warning">Предупреждение (желтый)</option>
                <option value="info">Информация (синий)</option>
                <option value="success">Успех (зеленый)</option>
                <option value="error">Ошибка (красный)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Настройки */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Настройки</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Способ доставки</label>
              <select
                value={delivery}
                onChange={e => setDelivery(e.target.value)}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Автоматическая</option>
                <option value="manual">Ручная</option>
              </select>
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => setEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Товар активен</span>
              </label>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}