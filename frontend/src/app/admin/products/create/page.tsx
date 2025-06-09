// frontend/src/app/admin/products/create/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface GameOption {
  id: number
  name: string
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

  useEffect(() => {
    api.get('/admin/games')
      .then(res => setGames(res.data))
      .catch(err => console.error('Ошибка загрузки игр', err))
  }, [])

  const handleSubmit = async () => {
    try {
      await api.post('/admin/products', {
        game_id: gameId,
        name,
        price_rub: price,
        min_amount: minAmount,
        max_amount: maxAmount,
        type,
        description,
        instructions,
        enabled,
        delivery,
        sort_order: sortOrder,
      })
      router.push('/admin/products')
    } catch (err) {
      console.error('Ошибка при создании товара', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Создание товара</h1>

      <label className="text-sm text-zinc-400">Выберите игру</label>
      <select
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={gameId ?? ''}
        onChange={e => setGameId(Number(e.target.value))}
      >
        <option value="">— Выбрать игру —</option>
        {games.map(game => (
          <option key={game.id} value={game.id}>{game.name}</option>
        ))}
      </select>

      <label className="text-sm text-zinc-400">Название товара</label>
      <input type="text" className="w-full mb-3 p-2 bg-zinc-800 text-white rounded" value={name} onChange={e => setName(e.target.value)} />

      <label className="text-sm text-zinc-400">Цена (₽) за 1 шт.</label>
      <input type="number" className="w-full mb-3 p-2 bg-zinc-800 text-white rounded" value={price} onChange={e => setPrice(Number(e.target.value))} />

      <div className="flex gap-4 mb-3">
        <div className="w-full">
          <label className="text-sm text-zinc-400">Мин. кол-во (минимум, который может купить пользователь)</label>
          <input type="number" className="w-full p-2 bg-zinc-800 text-white rounded" value={minAmount} onChange={e => setMinAmount(Number(e.target.value))} />
        </div>
        <div className="w-full">
          <label className="text-sm text-zinc-400">Макс. кол-во (максимум за 1 заказ)</label>
          <input type="number" className="w-full p-2 bg-zinc-800 text-white rounded" value={maxAmount} onChange={e => setMaxAmount(Number(e.target.value))} />
        </div>
      </div>

      <label className="text-sm text-zinc-400">Тип товара</label>
      <select className="w-full mb-3 p-2 bg-zinc-800 text-white rounded" value={type} onChange={e => setType(e.target.value as any)}>
        <option value="currency">Валюта (₽, золото и т.п.)</option>
        <option value="item">Предмет (шмотки, ключи)</option>
        <option value="service">Услуга (услуги буста и т.п.)</option>
      </select>

      <label className="text-sm text-zinc-400">Описание товара</label>
      <textarea className="w-full mb-3 p-2 bg-zinc-800 text-white rounded" value={description} onChange={e => setDescription(e.target.value)} />

      <label className="text-sm text-zinc-400">Инструкция после покупки</label>
      <textarea className="w-full mb-3 p-2 bg-zinc-800 text-white rounded" value={instructions} onChange={e => setInstructions(e.target.value)} />

      <label className="text-sm text-zinc-400">Тип доставки</label>
      <select className="w-full mb-3 p-2 bg-zinc-800 text-white rounded" value={delivery} onChange={e => setDelivery(e.target.value)}>
        <option value="auto">Автоматическая (сразу после оплаты)</option>
        <option value="manual">Ручная (через оператора)</option>
      </select>

      <div className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        <label>Активен (отображается на сайте)</label>
      </div>

      <label className="text-sm text-zinc-400">Порядок сортировки (чем меньше — тем выше)</label>
      <input type="number" className="w-full mb-6 p-2 bg-zinc-800 text-white rounded" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />

      <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
        Создать товар
      </button>
    </div>
  )
}
