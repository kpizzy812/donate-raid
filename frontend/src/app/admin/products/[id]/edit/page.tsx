// frontend/src/app/admin/products/[id]/edit/page.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
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
      const response = await api.get('/admin/games/')
      setGames(response.data)
    } catch (error) {
      console.error('Ошибка загрузки игр:', error)
    }
  }

  const loadProduct = async () => {
    try {
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

      const response = await api.post('/upload/admin/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        setImageUrl(response.data.file_url)
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

      await api.put(`/admin/products/${productId}`, productData)
      alert('Товар успешно обновлен!')
      router.push('/admin/products')
    } catch (error) {
      console.error('Ошибка обновления товара:', error)
      alert('Ошибка обновления товара')
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
      <h1 className="text-2xl font-bold mb-6">Редактирование товара</h1>

      <div className="space-y-6">
        {/* Основная информация */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm text-zinc-400">Игра</label>
              <select
                className="w-full p-2 bg-zinc-700 text-white rounded"
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
              <label className="text-sm text-zinc-400">Тип товара</label>
              <select
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={type}
                onChange={e => setType(e.target.value as 'currency' | 'item' | 'service')}
              >
                <option value="currency">Валюта (золото, кристаллы)</option>
                <option value="item">Предмет (шмотки, ключи)</option>
                <option value="service">Услуга (услуги буста и т.п.)</option>
              </select>
            </div>
          </div>

          <label className="text-sm text-zinc-400">Название товара</label>
          <input
            type="text"
            className="w-full mb-3 p-2 bg-zinc-700 text-white rounded"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label className="text-sm text-zinc-400">Цена (₽)</label>
              <input
                type="number"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={priceRub}
                onChange={e => setPriceRub(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Старая цена (₽)</label>
              <input
                type="number"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={oldPriceRub || ''}
                onChange={e => setOldPriceRub(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Подкатегория</label>
              <input
                type="text"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm text-zinc-400">Мин. количество</label>
              <input
                type="number"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={minAmount}
                onChange={e => setMinAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Макс. количество</label>
              <input
                type="number"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={maxAmount}
                onChange={e => setMaxAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <label className="text-sm text-zinc-400">Описание</label>
          <textarea
            className="w-full mb-3 p-2 bg-zinc-700 text-white rounded"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <label className="text-sm text-zinc-400">Инструкция после покупки</label>
          <textarea
            className="w-full mb-3 p-2 bg-zinc-700 text-white rounded"
            rows={3}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
          />
        </div>

        {/* Картинка товара */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Картинка товара</h2>

          {imageUrl ? (
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="Превью товара"
                className="w-32 h-32 object-cover rounded border border-zinc-600"
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
              className="border-2 border-dashed border-zinc-600 hover:border-zinc-500 rounded-lg p-8 w-full text-center transition-colors disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                {imageUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                )}
                <span className="text-zinc-400">
                  {imageUploading ? 'Загрузка...' : 'Нажмите для загрузки картинки'}
                </span>
                <span className="text-xs text-zinc-500">PNG, JPG, WEBP до 5MB</span>
              </div>
            </button>
          )}
        </div>

        {/* Настройки и пометки */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Настройки и пометки</h2>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm text-zinc-400">Доставка</label>
              <select
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={delivery}
                onChange={e => setDelivery(e.target.value)}
              >
                <option value="auto">Автоматическая</option>
                <option value="manual">Ручная</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400">Порядок сортировки</label>
              <input
                type="number"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <label className="text-sm text-zinc-400">Особая пометка</label>
          <input
            type="text"
            className="w-full mb-2 p-2 bg-zinc-700 text-white rounded"
            value={specialNote}
            onChange={e => setSpecialNote(e.target.value)}
          />

          <label className="text-sm text-zinc-400">Тип пометки</label>
          <select
            className="w-full mb-3 p-2 bg-zinc-700 text-white rounded"
            value={noteType}
            onChange={e => setNoteType(e.target.value)}
          >
            <option value="warning">⚠️ Предупреждение (желтый)</option>
            <option value="info">ℹ️ Информация (синий)</option>
            <option value="success">✅ Успех (зеленый)</option>
            <option value="error">❌ Ошибка (красный)</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
            />
            <label>Активен (отображается на сайте)</label>
          </div>
        </div>

        {/* Настраиваемые поля для ввода */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Поля для ввода пользователем</h2>
            <button
              type="button"
              onClick={addInputField}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Добавить поле
            </button>
          </div>

          {inputFields.length === 0 && (
            <p className="text-zinc-400 text-sm mb-4">
              Поля для пользователя не настроены
            </p>
          )}

          {inputFields.map((field, index) => (
            <div key={index} className="border border-zinc-600 rounded p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Поле {index + 1}</span>
                <button
                  onClick={() => removeInputField(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="text-xs text-zinc-400">Название поля</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-zinc-700 text-white rounded text-sm"
                    value={field.name}
                    onChange={e => updateInputField(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Отображаемое название</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-zinc-700 text-white rounded text-sm"
                    value={field.label}
                    onChange={e => updateInputField(index, 'label', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <label className="text-xs text-zinc-400">Тип поля</label>
                  <select
                    className="w-full p-2 bg-zinc-700 text-white rounded text-sm"
                    value={field.type}
                    onChange={e => updateInputField(index, 'type', e.target.value)}
                  >
                    <option value="text">Текст</option>
                    <option value="email">Email</option>
                    <option value="password">Пароль</option>
                    <option value="number">Число</option>
                    <option value="select">Выпадающий список</option>
                    <option value="textarea">Многострочный текст</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Placeholder</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-zinc-700 text-white rounded text-sm"
                    value={field.placeholder || ''}
                    onChange={e => updateInputField(index, 'placeholder', e.target.value)}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateInputField(index, 'required', e.target.checked)}
                  />
                  <label className="ml-2 text-xs">Обязательное</label>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">Подсказка</label>
                <input
                  type="text"
                  className="w-full p-2 bg-zinc-700 text-white rounded text-sm"
                  value={field.help_text || ''}
                  onChange={e => updateInputField(index, 'help_text', e.target.value)}
                />
              </div>

              {field.type === 'select' && (
                <div className="mt-2">
                  <label className="text-xs text-zinc-400">Варианты выбора (через запятую)</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-zinc-700 text-white rounded text-sm"
                    value={field.options?.join(', ') || ''}
                    onChange={e => updateInputField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Кнопки */}
        <div className="flex gap-4">
          <button
            onClick={handleUpdate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Сохранить изменения
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            className="bg-zinc-600 hover:bg-zinc-700 text-white px-6 py-2 rounded"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}