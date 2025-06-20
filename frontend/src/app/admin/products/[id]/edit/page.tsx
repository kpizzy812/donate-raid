// frontend/src/app/admin/products/[id]/edit/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react'

interface Game {
  id: number
  name: string
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
  subcategory?: string
  image_url?: string
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const productId = parseInt(params.id)

  // Состояния
  const [games, setGames] = useState<Game[]>([])
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
  const [subcategory, setSubcategory] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [inputFields, setInputFields] = useState<InputField[]>([])

  useEffect(() => {
    loadGames()
    loadProduct()
  }, [productId])

  const loadGames = async () => {
    try {
      const response = await api.get('/admin/games')
      setGames(response.data)
    } catch (error) {
      console.error('Ошибка загрузки игр:', error)
    }
  }

  const loadProduct = async () => {
    try {
      // Исправлено: добавлен слеш в конце URL
      const response = await api.get(`/admin/products/${productId}`)
      const product = response.data

      setProduct(product)
      setGameId(product.game_id)
      setName(product.name)
      setPriceRub(product.price_rub)
      setOldPriceRub(product.old_price_rub || null)
      setMinAmount(product.min_amount)
      setMaxAmount(product.max_amount)
      setType(product.type)
      setDescription(product.description || '')
      setInstructions(product.instructions || '')
      setDelivery(product.delivery)
      setSortOrder(product.sort_order)
      setEnabled(product.enabled)
      setSpecialNote(product.special_note || '')
      setNoteType(product.note_type)
      setSubcategory(product.subcategory || '')
      setImageUrl(product.image_url || '')
      setInputFields(product.input_fields || [])

      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки товара:', error)
      alert('Ошибка загрузки товара')
      router.push('/admin/products')
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

      // ИСПРАВЛЕНО: правильный endpoint
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        setImageUrl(response.data.file_url)
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

  const handleUpdate = async () => {
    if (!gameId || !name.trim() || priceRub <= 0) {
      alert('Заполните обязательные поля')
      return
    }

    setSaving(true)
    try {
      const productData = {
        game_id: gameId,
        name: name.trim(),
        price_rub: priceRub,
        old_price_rub: oldPriceRub || null,
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
        subcategory: subcategory.trim() || null,
        image_url: imageUrl || null
      }

      console.log('Отправляем данные:', productData)

      // ИСПРАВЛЕНО: Используем правильный URL с слешем в конце
      const response = await api.put(`/admin/products/${productId}`, productData)

      console.log('Ответ сервера:', response.data)
      alert('Товар успешно обновлен!')
      router.push('/admin/products')
    } catch (error: any) {
      console.error('Ошибка обновления товара:', error)

      // Более детальное логирование ошибки
      if (error.response) {
        console.error('Статус ошибки:', error.response.status)
        console.error('Данные ошибки:', error.response.data)
        alert(`Ошибка обновления товара: ${error.response.data.detail || error.response.statusText}`)
      } else if (error.request) {
        console.error('Запрос не получил ответ:', error.request)
        alert('Ошибка сети: сервер не отвечает')
      } else {
        console.error('Ошибка настройки запроса:', error.message)
        alert(`Ошибка: ${error.message}`)
      }
    } finally {
      setSaving(false)
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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Название товара *</label>
            <input
              type="text"
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="1000 золота, Легендарный меч, Буст до 80 уровня..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Цена (₽) *</label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={priceRub}
                onChange={e => setPriceRub(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Старая цена (₽)</label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={oldPriceRub || ''}
                onChange={e => setOldPriceRub(e.target.value ? Number(e.target.value) : null)}
                placeholder="Для зачеркивания"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Подкатегория</label>
              <input
                type="text"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                placeholder="Валюта, Оружие, Буст..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Мин. количество</label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={minAmount}
                onChange={e => setMinAmount(Number(e.target.value))}
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Макс. количество</label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={maxAmount}
                onChange={e => setMaxAmount(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Подробное описание товара..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Инструкция после покупки</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Что делать после покупки..."
            />
          </div>
        </div>

        {/* Картинка товара */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Картинка товара</h2>

          {imageUrl ? (
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="Превью товара"
                className="w-32 h-32 object-cover rounded-lg border border-zinc-300 dark:border-zinc-600"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                )}
                <span className="text-zinc-600 dark:text-zinc-400">
                  {imageUploading ? 'Загрузка...' : 'Нажмите для загрузки картинки'}
                </span>
                <span className="text-xs text-zinc-500">PNG, JPG, WEBP до 5MB</span>
              </div>
            </button>
          )}
        </div>

        {/* Настройки и пометки */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Настройки и пометки</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Доставка</label>
              <select
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                value={delivery}
                onChange={e => setDelivery(e.target.value)}
              >
                <option value="auto">Автоматическая</option>
                <option value="manual">Ручная</option>
              </select>
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
            <label className="block text-sm font-medium mb-2">Особая пометка</label>
            <input
              type="text"
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              value={specialNote}
              onChange={e => setSpecialNote(e.target.value)}
              placeholder="Не подходит для РУ аккаунта, Только для VIP..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Тип пометки</label>
            <select
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              value={noteType}
              onChange={e => setNoteType(e.target.value)}
            >
              <option value="warning">⚠️ Предупреждение (желтый)</option>
              <option value="info">ℹ️ Информация (синий)</option>
              <option value="success">✅ Успех (зеленый)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="enabled" className="text-sm">Товар активен</label>
          </div>
        </div>

        {/* Поля для ввода данных */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Поля для ввода данных пользователем</h2>
            <button
              onClick={addInputField}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить поле
            </button>
          </div>

          {inputFields.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              Поля для ввода данных не добавлены. Например: Email, Player ID, Регион и т.д.
            </p>
          ) : (
            <div className="space-y-4">
              {inputFields.map((field, index) => (
                <div key={index} className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Поле #{index + 1}</h3>
                    <button
                      onClick={() => removeInputField(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Название поля</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                        value={field.name}
                        onChange={e => updateInputField(index, 'name', e.target.value)}
                        placeholder="player_id, email, region..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Подпись</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                        value={field.label}
                        onChange={e => updateInputField(index, 'label', e.target.value)}
                        placeholder="Player ID, Email, Регион..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Тип поля</label>
                      <select
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                        value={field.type}
                        onChange={e => updateInputField(index, 'type', e.target.value)}
                      >
                        <option value="text">Текст</option>
                        <option value="email">Email</option>
                        <option value="password">Пароль</option>
                        <option value="number">Число</option>
                        <option value="select">Выпадающий список</option>
                        <option value="textarea">Большой текст</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Подсказка</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                        value={field.placeholder || ''}
                        onChange={e => updateInputField(index, 'placeholder', e.target.value)}
                        placeholder="Введите ваш Player ID..."
                      />
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">Варианты (через запятую)</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                        value={field.options?.join(', ') || ''}
                        onChange={e => updateInputField(index, 'options', e.target.value.split(', ').filter(Boolean))}
                        placeholder="Россия, Европа, Америка, Азия"
                      />
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Текст помощи</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                      value={field.help_text || ''}
                      onChange={e => updateInputField(index, 'help_text', e.target.value)}
                      placeholder="Дополнительная информация для пользователя"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field.required}
                      onChange={e => updateInputField(index, 'required', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`required-${index}`} className="text-sm">Обязательное поле</label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/admin/products')}
            className="flex-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-3 rounded-lg font-medium transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Отмена
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}