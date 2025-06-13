// frontend/src/app/admin/games/create/page.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/adminApi'
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

      const response = await adminApi.post('/upload/image', formData)
      setBannerUrl(response.data.file_url)
    } catch (error) {
      console.error('Ошибка загрузки:', error)
      alert('Ошибка загрузки файла')
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

      await adminApi.post('/admin/games/', gameData)
      alert('Игра успешно создана!')
      router.push('/admin/games')
    } catch (error) {
      console.error('Ошибка создания игры:', error)
      alert('Ошибка создания игры')
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
              <img
                src={bannerUrl}
                alt="Баннер игры"
                className="w-full max-w-md h-32 object-cover rounded border border-zinc-600"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                )}
                <span className="text-zinc-400">
                  {bannerUploading ? 'Загрузка...' : 'Нажмите для загрузки баннера'}
                </span>
                <span className="text-xs text-zinc-500">PNG, JPG, WEBP до 5MB</span>
              </div>
            </button>
          )}
        </div>

        {/* Инструкции */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">📖 Инструкции к игре</h2>
          <p className="text-sm text-zinc-400 mb-3">
            Здесь вы можете добавить подробные инструкции о том, как работает процесс пополнения в данной игре
          </p>
          <textarea
            className="w-full p-3 bg-zinc-700 text-white rounded"
            rows={6}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Например:&#10;1. Укажите ваш игровой ID&#10;2. Выберите сервер&#10;3. После оплаты валюта поступит в течение 5-15 минут&#10;4. Проверьте почту - мы отправим подтверждение"
          />
        </div>

        {/* FAQ */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">❓ Часто задаваемые вопросы (FAQ)</h2>
          <p className="text-sm text-zinc-400 mb-3">
            Добавьте ответы на часто задаваемые вопросы по данной игре
          </p>
          <textarea
            className="w-full p-3 bg-zinc-700 text-white rounded"
            rows={8}
            value={faq}
            onChange={e => setFaq(e.target.value)}
            placeholder="Например:&#10;&#10;Q: Как найти мой игровой ID?&#10;A: Зайдите в настройки игры, там будет указан ваш уникальный ID&#10;&#10;Q: Сколько времени занимает пополнение?&#10;A: Обычно 5-15 минут, максимум до 2 часов&#10;&#10;Q: Что делать если валюта не пришла?&#10;A: Обратитесь в поддержку с номером заказа"
          />
        </div>

        {/* Настройки */}
        <div className="bg-zinc-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Настройки</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoSupport}
                onChange={e => setAutoSupport(e.target.checked)}
                id="auto-support"
              />
              <label htmlFor="auto-support">
                Автоматическая поддержка (если выключено - заказы обрабатываются вручную)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                id="enabled"
              />
              <label htmlFor="enabled">
                Активна (отображается на сайте)
              </label>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/games')}
            className="bg-zinc-600 hover:bg-zinc-700 text-white px-4 py-2 rounded"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Создать игру
          </button>
        </div>
      </div>
    </div>
  )
}