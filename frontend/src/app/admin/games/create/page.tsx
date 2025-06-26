// frontend/src/app/admin/games/create/page.tsx - ДОБАВЛЯЕМ ПОЛЯ ВВОДА
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Upload, ImageIcon, Trash2 } from 'lucide-react'

interface Subcategory {
  name: string
  description: string
  sort_order: number
  enabled: boolean
}

// ДОБАВЛЕНО: Интерфейс для полей ввода
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
  subcategory_id?: number | null  // ДОБАВЛЕНО: привязка к подкатегории
}

export default function CreateGamePage() {
  const router = useRouter()

  // Основные поля
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [faq, setFaq] = useState('')
  const [subcategoryDescription, setSubcategoryDescription] = useState('')
  const [autoSupport, setAutoSupport] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)

  // Изображения
  const [bannerUrl, setBannerUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUploading, setBannerUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  // Подкатегории
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])

  // ДОБАВЛЕНО: Поля ввода
  const [inputFields, setInputFields] = useState<InputField[]>([])

  // ДОБАВЛЕНО: Функции управления полями ввода
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

  // Функции управления подкатегориями (без изменений)
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

  // ОБНОВЛЕННАЯ функция создания игры
  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Введите название игры')
      return
    }

    try {
      console.log('🎮 Начинаем создание игры...')

      // Сначала создаем игру БЕЗ полей ввода (они будут созданы после подкатегорий)
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
        sort_order: sortOrder,
        input_fields: []  // ИЗМЕНЕНО: создаем поля ввода отдельно после подкатегорий
      }

      console.log('📤 Отправляем данные игры:', gameData)

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
      console.log('✅ Игра создана с ID:', gameId)

      // Создаем подкатегории и сохраняем mapping индексов к ID
      const subcategoryIdMapping: { [index: number]: number } = {}
      console.log('🏷️ Начинаем создание подкатегорий...')
      let createdSubcategories = 0
      let errorCount = 0

      for (let i = 0; i < subcategories.length; i++) {
        const subcategory = subcategories[i]
        console.log(`🏷️ Обрабатываем подкатегорию ${i + 1}/${subcategories.length}:`, subcategory)

        if (subcategory.name.trim()) {
          const subcategoryData = {
            game_id: gameId,
            name: subcategory.name.trim(),
            description: subcategory.description.trim() || null,
            sort_order: subcategory.sort_order,
            enabled: subcategory.enabled
          }

          try {
            const subcategoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${gameId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(subcategoryData)
            })

            if (subcategoryResponse.ok) {
              const createdSubcategory = await subcategoryResponse.json()
              console.log('✅ Подкатегория создана:', createdSubcategory)
              subcategoryIdMapping[i] = createdSubcategory.id  // ДОБАВЛЕНО: сохраняем mapping
              createdSubcategories++
            } else {
              const errorData = await subcategoryResponse.json()
              console.error('❌ Ошибка создания подкатегории:', errorData)
              errorCount++
            }
          } catch (subcategoryError) {
            console.error('❌ Сетевая ошибка при создании подкатегории:', subcategoryError)
            errorCount++
          }
        }
      }

      // ДОБАВЛЕНО: Создаем поля ввода с правильными subcategory_id
      if (inputFields.length > 0) {
        console.log('📝 Начинаем создание полей ввода...')

        // Маппим поля ввода на правильные subcategory_id
        const mappedInputFields = inputFields.map(field => {
          const mappedField = { ...field }

          // Если поле привязано к подкатегории, заменяем индекс на реальный ID
          if (field.subcategory_id !== null && field.subcategory_id !== undefined) {
            mappedField.subcategory_id = subcategoryIdMapping[field.subcategory_id] || null
          }

          return mappedField
        })

        // Отправляем поля ввода на сервер (если у вас есть отдельный API для этого)
        // Или обновляем игру с полями ввода
        try {
          const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games/${gameId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              input_fields: mappedInputFields
            })
          })

          if (updateResponse.ok) {
            console.log('✅ Поля ввода созданы')
          } else {
            console.error('❌ Ошибка создания полей ввода')
          }
        } catch (error) {
          console.error('❌ Ошибка при создании полей ввода:', error)
        }
      }

      console.log(`📊 Итоги: игра создана, подкатегорий ${createdSubcategories}, ошибок ${errorCount}`)

      if (errorCount > 0) {
        alert(`⚠️ Игра создана, но при создании подкатегорий произошли ошибки.\nСоздано: ${createdSubcategories}\nОшибок: ${errorCount}`)
      } else {
        alert(`✅ Игра, ${createdSubcategories} подкатегорий и ${inputFields.length} полей ввода успешно созданы!`)
      }

      router.push('/admin/games')
    } catch (error: any) {
      console.error('❌ Общая ошибка создания игры:', error)
      alert(`❌ Ошибка создания игры: ${error.message}`)
    }
  }

  // Функции загрузки изображений (без изменений)
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

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
    const baseUrl = apiUrl.replace('/api', '')
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
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
              placeholder="Краткое описание игры..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Описание подкатегорий</label>
            <input
              type="text"
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              value={subcategoryDescription}
              onChange={e => setSubcategoryDescription(e.target.value)}
              placeholder="Выберите регион"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoSupport}
                onChange={e => setAutoSupport(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Автоматическая поддержка</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Включена</span>
            </label>
          </div>
        </div>

        {/* Подкатегории */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Подкатегории игры</h2>
            <button
              type="button"
              onClick={addSubcategory}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить подкатегорию
            </button>
          </div>

          {subcategories.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
              Подкатегории позволяют разделить товары по регионам или типам (например: Россия, Глобал, Индонезия для Mobile Legends).
              Если подкатегории не нужны, можно оставить пустым.
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
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Название подкатегории *</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                    value={subcategory.name}
                    onChange={e => updateSubcategory(index, 'name', e.target.value)}
                    placeholder="Россия"
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
                  placeholder="Товары для российского сервера"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subcategory.enabled}
                    onChange={e => updateSubcategory(index, 'enabled', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Включена</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Поля для ввода пользователем */}
<div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold">Поля для ввода пользователем</h2>
    <button
      type="button"
      onClick={addInputField}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Добавить поле
    </button>
  </div>

  {inputFields.length === 0 && (
    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
      Поля, которые пользователь должен заполнить при покупке товаров этой игры.
      Можно привязать поля к конкретным подкатегориям или оставить общими для всей игры.
    </p>
  )}

  {inputFields.map((field, index) => (
    <div key={index} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">Поле #{index + 1}</h4>
        <button
          onClick={() => removeInputField(index)}
          className="text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium mb-1">Название поля *</label>
          <input
            type="text"
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
            value={field.name}
            onChange={e => updateInputField(index, 'name', e.target.value)}
            placeholder="player_id"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Отображаемое название *</label>
          <input
            type="text"
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
            value={field.label}
            onChange={e => updateInputField(index, 'label', e.target.value)}
            placeholder="Player ID"
          />
        </div>
        {/* ДОБАВЛЕНО: Выбор подкатегории */}
        <div>
          <label className="block text-sm font-medium mb-1">Подкатегория</label>
          <select
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
            value={field.subcategory_id || ''}
            onChange={e => updateInputField(index, 'subcategory_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Для всех подкатегорий</option>
            {subcategories.map((sub, subIndex) => (
              <option key={subIndex} value={subIndex}>
              {sub.name || `Подкатегория ${subIndex + 1}`}
            </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 mt-1">
            Если не выбрано - поле будет показываться для всех подкатегорий
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
            <option value="textarea">Многострочный текст</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Placeholder</label>
          <input
            type="text"
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
            value={field.placeholder || ''}
            onChange={e => updateInputField(index, 'placeholder', e.target.value)}
            placeholder="Введите ваш Player ID"
          />
        </div>
      </div>

      {field.type === 'select' && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Варианты выбора</label>
          <textarea
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
            rows={3}
            value={field.options?.join('\n') || ''}
            onChange={e => updateInputField(index, 'options', e.target.value.split('\n').filter(opt => opt.trim()))}
            placeholder="Россия&#10;Глобал&#10;Индонезия"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Подсказка</label>
          <input
            type="text"
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
            value={field.help_text || ''}
            onChange={e => updateInputField(index, 'help_text', e.target.value)}
            placeholder="Найдите Player ID в настройках игры"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.required}
              onChange={e => updateInputField(index, 'required', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Обязательное</span>
          </label>
        </div>
      </div>
    </div>
  ))}
</div>

        {/* Логотип и баннер (без изменений) */}
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
                <Upload className="w-8 h-8 text-zinc-400 animate-spin" />
              ) : (
                <ImageIcon className="w-8 h-8 text-zinc-400" />
              )}
              <span className="text-zinc-600 dark:text-zinc-400">
                {logoUploading ? 'Загрузка...' : 'Нажмите для загрузки логотипа'}
              </span>
            </button>
          )}
        </div>

        {/* Инструкции и FAQ (без изменений) */}
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