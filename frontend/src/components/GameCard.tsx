// frontend/src/components/GameCard.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ С LOGO_URL
import Link from 'next/link'
import { useState } from 'react'

type Props = {
  game: {
    id: number
    name: string
    logo_url?: string  // ИЗМЕНЕНО: используем logo_url вместо banner_url
    description?: string  // ДОБАВЛЕНО: описание игры
  }
}

export default function GameCard({ game }: Props) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Функция для получения полного URL изображения
  const getImageUrl = (url?: string) => {
    if (!url) return null

    // Если URL уже полный, возвращаем как есть
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    // Получаем базовый URL БЕЗ /api суффикса
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
    const baseUrl = apiUrl.replace('/api', '') // Убираем /api

    // Формируем полный URL
    const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
    return fullUrl
  }

  const imageUrl = getImageUrl(game.logo_url)  // ИЗМЕНЕНО: используем logo_url

  return (
    <Link
      href={`/game/${game.id}`}
      className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 hover:scale-105 hover:shadow-lg p-4"
    >
      {/* ИЗМЕНЕНО: Квадратная картинка вместо прямоугольной */}
      <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 relative bg-zinc-100 dark:bg-zinc-800">
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={game.name}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                console.error('❌ Ошибка загрузки изображения игры:', imageUrl)
                setImageError(true)
                setImageLoading(false)
              }}
            />
          </>
        ) : (
          // Заглушка для игр без изображения
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-1">🎮</div>
              <div className="text-xs font-medium opacity-90">
                {game.name.length > 12 ? `${game.name.substring(0, 12)}...` : game.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ДОБАВЛЕНО: Название и описание игры */}
      <div className="flex-1">
        <h3 className="font-semibold text-lg mb-2 text-zinc-900 dark:text-white line-clamp-2">
          {game.name}
        </h3>

        {/* ДОБАВЛЕНО: Описание игры */}
        {game.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
            {game.description}
          </p>
        )}
      </div>
    </Link>
  )
}