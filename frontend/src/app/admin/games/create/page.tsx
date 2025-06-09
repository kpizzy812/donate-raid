// frontend/src/app/admin/games/create/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function CreateGamePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [instructions, setInstructions] = useState('')
  const [autoSupport, setAutoSupport] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)

  const handleSubmit = async () => {
    try {
      await api.post('/admin/games', {
        name,
        banner_url: bannerUrl,
        instructions,
        auto_support: autoSupport,
        sort_order: sortOrder,
      })
      router.push('/admin/games')
    } catch (err) {
      console.error('Ошибка при создании игры', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Создание игры</h1>

      <input
        type="text"
        placeholder="Название игры"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Ссылка на баннер"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={bannerUrl}
        onChange={e => setBannerUrl(e.target.value)}
      />
      <textarea
        placeholder="Инструкция (если ручная поддержка)"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={instructions}
        onChange={e => setInstructions(e.target.value)}
      />
      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={autoSupport}
          onChange={e => setAutoSupport(e.target.checked)}
        />
        <label>Поддержка автоматическая</label>
      </div>
      <input
        type="number"
        placeholder="Порядок сортировки"
        className="w-full mb-6 p-2 bg-zinc-800 text-white rounded"
        value={sortOrder}
        onChange={e => setSortOrder(parseInt(e.target.value))}
      />

      <button
        onClick={handleSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        Создать игру
      </button>
    </div>
  )
}
