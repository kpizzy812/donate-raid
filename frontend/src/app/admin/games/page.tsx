// frontend/src/app/admin/games/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Game {
  id: number
  name: string
  sort_order: number
  auto_support: boolean
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const router = useRouter()

  useEffect(() => {
    api.get('/admin/games')
      .then(res => setGames(res.data))
      .catch(err => console.error('Ошибка загрузки игр', err))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить игру?')) return
    try {
      await api.delete(`/admin/games/${id}`)
      setGames(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      console.error('Ошибка удаления игры', err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Игры</h1>
        <Link href="/admin/games/create" className="bg-green-600 text-white px-4 py-2 rounded">
          + Новая игра
        </Link>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-700">
          <tr>
            <th className="py-2">ID</th>
            <th>Название</th>
            <th>С авто-поддержкой</th>
            <th>Порядок</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            <tr key={game.id} className="border-b border-zinc-800 hover:bg-zinc-800">
              <td className="py-2 pr-2">{game.id}</td>
              <td>{game.name}</td>
              <td>{game.auto_support ? 'Да' : 'Нет'}</td>
              <td>{game.sort_order}</td>
              <td className="text-right space-x-2">
                <Link href={`/admin/games/${game.id}/edit`} className="text-blue-500 hover:underline">
                  Редактировать
                </Link>
                <button onClick={() => handleDelete(game.id)} className="text-red-500 hover:underline">
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
