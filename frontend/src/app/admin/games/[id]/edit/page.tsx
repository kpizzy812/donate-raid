// frontend/src/app/admin/games/[id]/edit/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function EditGamePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [instructions, setInstructions] = useState('')
  const [autoSupport, setAutoSupport] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)

  useEffect(() => {
    if (!id) return
    api.get(`/admin/games/${id}`)
      .then(res => {
        const g = res.data
        setName(g.name)
        setBannerUrl(g.banner_url || '')
        setInstructions(g.instructions || '')
        setAutoSupport(g.auto_support)
        setSortOrder(g.sort_order)
      })
      .catch(err => console.error('Ошибка загрузки игры', err))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdate = async () => {
    try {
      await api.put(`/admin/games/${id}`, {
        name,
        banner_url: bannerUrl,
        instructions,
        auto_support: autoSupport,
        sort_order: sortOrder,
      })
      router.push('/admin/games')
    } catch (err) {
      console.error('Ошибка при обновлении игры', err)
    }
  }

  if (loading) return <div className="p-6 text-center">Загрузка...</div>

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Редактирование игры</h1>

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
        onClick={handleUpdate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Сохранить изменения
      </button>
    </div>
  )
}
