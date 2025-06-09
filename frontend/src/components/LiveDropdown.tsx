'use client'

import Link from 'next/link'

type Game = {
  id: number
  name: string
  banner_url: string
}

type Props = {
  query: string
  games: Game[]
  loading: boolean
}

export default function LiveDropdown({ query, games, loading }: Props) {
  if (!query.trim()) return null

  return (
    <div className="absolute mt-1 w-full rounded-md bg-white dark:bg-zinc-900 shadow-lg border border-zinc-300 dark:border-zinc-700 z-10">
      <div className="p-2 text-sm max-h-72 overflow-y-auto">
        {loading ? (
          <div className="text-center text-zinc-500">Загрузка...</div>
        ) : games.length > 0 ? (
          games.map((game) => (
            <Link
              key={game.id}
              href={`/game/${game.id}`}
              className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition"
            >
              <img src={game.banner_url} alt={game.name} className="w-10 h-10 object-cover rounded-md" />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{game.name}</span>
            </Link>
          ))
        ) : (
          <div className="text-center text-zinc-500">
            Ничего не найдено по запросу <strong>{query}</strong>
            <div className="mt-2">
              <Link
                href="/manual-request"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Задонатить в свою игру
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
