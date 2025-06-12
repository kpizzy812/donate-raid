// frontend/src/app/admin/products/create/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface GameOption {
  id: number
  name: string
}

interface InputField {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'password'
  required: boolean
  placeholder?: string
}

export default function CreateProductPage() {
  const router = useRouter()
  const [games, setGames] = useState<GameOption[]>([])
  const [gameId, setGameId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [minAmount, setMinAmount] = useState(1)
  const [maxAmount, setMaxAmount] = useState(1)
  const [type, setType] = useState<'currency' | 'item' | 'service'>('currency')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [delivery, setDelivery] = useState('auto')
  const [sortOrder, setSortOrder] = useState(0)
  const [oldPrice, setOldPrice] = useState(0)
  const [specialNote, setSpecialNote] = useState('')
  const [noteType, setNoteType] = useState('warning')
  const [subcategory, setSubcategory] = useState('')
  const [inputFields, setInputFields] = useState<InputField[]>([])

  useEffect(() => {
    api.get('/admin/games')
      .then(res => setGames(res.data))
      .catch(err => console.error('Ошибка загрузки игр', err))
  }, [])

  const addInputField = () => {
    setInputFields([...inputFields, {
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: ''
    }])
  }

  const updateInputField = (index: number, field: keyof InputField, value: any) => {
    const newFields = [...inputFields]
    newFields[index] = { ...newFields[index], [field]: value }
    setInputFields(newFields)
  }

  const removeInputField = (index: number) => {
    setInputFields(inputFields.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      await api.post('/admin/products', {
        game_id: gameId,
        name,
        price_rub: price,
        old_price_rub: oldPrice || null,
        min_amount: minAmount,
        max_amount: maxAmount,
        type,
        description,
        instructions,
        enabled,
        delivery,
        sort_order: sortOrder,
        special_note: specialNote || null,
        note_type: noteType,
        subcategory: subcategory || null,
        input_fields: inputFields.filter(field => field.name && field.label), // Только заполненные поля
      })
      router.push('/admin/products')
    } catch (err) {
      console.error('Ошибка при создании товара', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Создание товара</h1>

      <div className="space-y-4">
        {/* Основные поля товара */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

          <label className="text-sm text-zinc-400">Выберите игру</label>
          <select
            className="w-full mb-3 p-2 bg-zinc-700 text-white rounded"
            value={gameId ?? ''}
            onChange={e => setGameId(Number(e.target.value))}
          >
            <option value="">— Выбрать игру —</option>
            {games.map(game => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </select>

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
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Старая цена (₽)</label>
              <input
                type="number"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={oldPrice}
                onChange={e => setOldPrice(Number(e.target.value) || 0)}
                placeholder="Оставьте пустым если нет"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Тип товара</label>
              <select
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={type}
                onChange={e => setType(e.target.value as any)}
              >
                <option value="currency">Валюта</option>
                <option value="item">Предмет</option>
                <option value="service">Услуга</option>
              </select>
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

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm text-zinc-400">Подкатегория</label>
              <input
                type="text"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                placeholder="Валюта, Оружие, Буст..."
              />
            </div>
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
          </div>

          <label className="text-sm text-zinc-400">Особая пометка</label>
          <input
            type="text"
            className="w-full mb-2 p-2 bg-zinc-700 text-white rounded"
            value={specialNote}
            onChange={e => setSpecialNote(e.target.value)}
            placeholder="Не подходит для РУ аккаунта, Хит продаж..."
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

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm text-zinc-400">Порядок сортировки</label>
              <input
                type="number"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
              />
              <label>Активен (отображается на сайте)</label>
            </div>
          </div>
        </div>

        {/* Настраиваемые поля для ввода */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Поля для ввода пользователем</h2>
            <button
              type="button"
              onClick={addInputField}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              + Добавить поле
            </button>
          </div>

          {inputFields.length === 0 && (
            <p className="text-zinc-400 text-sm mb-4">
              Здесь вы можете добавить поля, которые пользователь должен заполнить при покупке
              (например: Email, Player ID, Регион, Сервер и т.д.)
            </p>
          )}

          {inputFields.map((field, index) => (
            <div key={index} className="bg-zinc-700 p-3 rounded mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Поле #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeInputField(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ✕ Удалить
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="text-xs text-zinc-400">Название поля (name)</label>
                  <input
                    type="text"
                    placeholder="player_id"
                    className="w-full p-2 bg-zinc-600 text-white rounded text-sm"
                    value={field.name}
                    onChange={e => updateInputField(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Отображаемое название</label>
                  <input
                    type="text"
                    placeholder="Player ID"
                    className="w-full p-2 bg-zinc-600 text-white rounded text-sm"
                    value={field.label}
                    onChange={e => updateInputField(index, 'label', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="text-xs text-zinc-400">Тип поля</label>
                  <select
                    className="w-full p-2 bg-zinc-600 text-white rounded text-sm"
                    value={field.type}
                    onChange={e => updateInputField(index, 'type', e.target.value)}
                  >
                    <option value="text">Текст</option>
                    <option value="email">Email</option>
                    <option value="number">Число</option>
                    <option value="password">Пароль</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Placeholder</label>
                  <input
                    type="text"
                    placeholder="Введите ваш Player ID"
                    className="w-full p-2 bg-zinc-600 text-white rounded text-sm"
                    value={field.placeholder || ''}
                    onChange={e => updateInputField(index, 'placeholder', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={e => updateInputField(index, 'required', e.target.checked)}
                />
                <label className="text-xs text-zinc-400">Обязательное поле</label>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold"
        >
          Создать товар
        </button>
      </div>
    </div>
  )
}