// frontend/src/components/GameCard.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import Link from 'next/link'
import { useState } from 'react'

type Props = {
  game: {
    id: number
    name: string
    banner_url?: string
  }
}

export default function GameCard({ game }: Props) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // ИСПРАВЛЕНО: Функция для получения полного URL изображения
  const getImageUrl = (url?: string) => {
    if (!url) return null

    // Если URL уже полный, возвращаем как есть
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('🔗 URL уже полный:', url)
      return url
    }

    // ИСПРАВЛЕНО: Получаем базовый URL БЕЗ /api суффикса
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
    const baseUrl = apiUrl.replace('/api', '') // Убираем /api

    // Формируем полный URL
    const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
    console.log('🔗 GameCard формирует URL:', url, '->', fullUrl)

    return fullUrl
  }

  const imageUrl = getImageUrl(game.banner_url)

  return (
    <Link
      href={`/game/${game.id}`}
      className="flex flex-col items-center transition hover:scale-105"
    >
      <div className="w-full min-w-[160px] aspect-square rounded-2xl overflow-hidden shadow border-2 border-transparent hover:border-blue-500 transition relative">
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={game.name}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                console.error('❌ Ошибка загрузки изображения:', imageUrl)
                setImageError(true)
                setImageLoading(false)
              }}
            />
          </>
        ) : (
          // Заглушка для игр без изображения
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🎮</div>
              <div className="text-xs text-zinc-400 px-2">
                {game.name.substring(0, 10)}...
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 text-center text-sm font-medium text-zinc-100">
        {game.name}
      </div>
    </Link>
  )
}