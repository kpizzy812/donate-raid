'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GameCard from '@/components/GameCard'
import { fetchGames } from '@/lib/api'
import LiveDropdown from '@/components/LiveDropdown'

type Game = {
  id: number
  name: string
  banner_url: string
}

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const load = async (query = '') => {
    try {
      setLoading(true)
      const data = await fetchGames(query)
      setGames(data)
      if (query.trim()) setSearched(true)
      else setSearched(false)
    } catch (err) {
      console.error('Ошибка при загрузке игр:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      load(search)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  return (
    <section className="py-6 space-y-6 w-[720px] max-w-full mx-auto">
      <div className="relative w-full">
  {/* Иконка поиска */}
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2"
      viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  </div>

  <input
  type="text"
  placeholder="Найти игру или сервис"
  className="w-full h-12 pl-10 pr-4 text-sm
             bg-white text-black placeholder-zinc-500
             dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400
             focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>


  {/* dropdown с результатами */}
  {search && (
    <LiveDropdown query={search} games={games} loading={loading} />
  )}
</div>



      {loading ? (
        <p className="text-center text-sm text-gray-500">Загрузка...</p>
      ) : games.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
