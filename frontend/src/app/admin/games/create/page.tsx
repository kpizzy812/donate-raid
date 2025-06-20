// frontend/src/app/admin/games/create/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/adminApi'
import { api } from '@/lib/api' // ИСПРАВЛЕНО: добавлен импорт api
import { Upload, X, ImageIcon } from 'lucide-react'

export default function CreateGamePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [faq, setFaq] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [autoSupport, setAutoSupport] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [bannerUploading, setBannerUploading] = useState(false)

  const uploadBanner = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой (максимум 5MB)')
      return
    }

    setBannerUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subfolder', 'games')

      // ИСПРАВЛЕНО: используем правильный endpoint для загрузки
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      console.log('Ответ загрузки:', response.data) // Для отладки

      if (response.data.success && response.data.file_url) {
        const fileUrl = response.data.file_url
        setBannerUrl(fileUrl)
        console.log('URL изображения установлен:', fileUrl)
      } else {
        throw new Error('Неожиданный ответ сервера')
      }
    } catch (error: any) {
      console.error('Ошибка загрузки:', error)

      // Дополнительная диагностика
      if (error.response) {
        console.error('Статус ошибки:', error.response.status)
        console.error('Данные ошибки:', error.response.data)
        alert(`Ошибка загрузки: ${error.response.data.detail || error.response.statusText}`)
      } else {
        alert('Ошибка загрузки файла')
      }
    } finally {
      setBannerUploading(false)
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

  const removeBanner = () => {
    setBannerUrl('')
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Введите название игры')
      return
    }

    try {
      const gameData = {
        name: name.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        faq: faq.trim() || null,
        banner_url: bannerUrl || null,
        auto_support: autoSupport,
        enabled,
        sort_order: sortOrder
      }

      console.log('Отправляем данные игры:', gameData) // Отладка

      await adminApi.post('/admin/games', gameData)
      alert('Игра успешно создана!')
      router.push('/admin/games')
    } catch (error: any) {
      console.error('Ошибка создания игры:', error)

      // Лучшая диагностика ошибок
      if (error.response) {
        console.error('Статус ошибки:', error.response.status)
        console.error('Данные ошибки:', error.response.data)
        alert(`Ошибка создания игры: ${error.response.data.detail || error.response.statusText}`)
      } else {
        alert('Ошибка создания игры')
      }
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Создание игры</h1>

      <div className="space-y-6">
        {/* Основная информация */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm text-zinc-400">Название игры *</label>
              <input
                type="text"
                className="w-full p-2 bg-zinc-700 text-white rounded"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Название игры"
              />
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

          <label className="text-sm text-zinc-400">Описание</label>
          <textarea
            className="w-full mb-3 p-2 bg-zinc-700 text-white rounded"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Краткое описание игры..."
          />
        </div>

        {/* Баннер игры */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Баннер игры</h2>

          {bannerUrl ? (
            <div className="relative inline-block">
              {/* ИСПРАВЛЕНО: Используем getImageUrl для правильного отображения */}
              <img
                src={bannerUrl.startsWith('http') ? bannerUrl : (() => {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
                  const baseUrl = apiUrl.replace('/api', '')
                  return bannerUrl.startsWith('/') ? `${baseUrl}${bannerUrl}` : `${baseUrl}/${bannerUrl}`
                })()}
                alt="Баннер игры"
                className="w-full max-w-md h-32 object-cover rounded border border-zinc-600"
                onError={(e) => {
                  console.error('❌ Ошибка загрузки баннера:', bannerUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
              <button
                onClick={removeBanner}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleBannerUpload}
              disabled={bannerUploading}
              className="border-2 border-dashed border-zinc-600 hover:border-zinc-500 rounded-lg p-8 w-full text-center transition-colors disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                {bannerUploading ? (
                  <Upload className="w-8 h-8 text-zinc-400 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                )}
                <span className="text-zinc-400">
                  {bannerUploading ? 'Загрузка...' : 'Нажмите для загрузки баннера'}
                </span>
                <span className="text-xs text-zinc-500">Форматы: JPG, PNG, GIF. Макс. 5MB</span>
              </div>
            </button>
          )}
        </div>

        {/* Детальная информация */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Детальная информация</h2>

          <label className="text-sm text-zinc-400">Инструкции</label>
          <textarea
            className="w-full mb-3 p-2 bg-zinc-700 text-white rounded"
            rows={4}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Инструкции по игре..."
          />

          <label className="text-sm text-zinc-400">FAQ</label>
          <textarea
            className="w-full mb-3 p-2 bg-zinc-700 text-white rounded"
            rows={4}
            value={faq}
            onChange={e => setFaq(e.target.value)}
            placeholder="Часто задаваемые вопросы..."
          />
        </div>

        {/* Настройки */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Настройки</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoSupport}
                onChange={e => setAutoSupport(e.target.checked)}
                className="form-checkbox"
              />
              <span className="text-sm">Автоматическая поддержка</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="form-checkbox"
              />
              <span className="text-sm">Игра активна</span>
            </label>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Создать игру
          </button>
          <button
            onClick={() => router.push('/admin/games')}
            className="bg-zinc-600 hover:bg-zinc-700 text-white px-6 py-2 rounded"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}