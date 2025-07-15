// frontend/src/components/admin/SortableGamesList.tsx
'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { ChevronUp, ChevronDown, GripVertical, Edit, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import Link from 'next/link'

interface Game {
  id: number
  name: string
  sort_order: number
  enabled: boolean
  banner_url?: string
  logo_url?: string
}

interface Props {
  games: Game[]
  onGamesUpdate: (games: Game[]) => void
}

export function SortableGamesList({ games: initialGames, onGamesUpdate }: Props) {
  const [games, setGames] = useState<Game[]>(initialGames)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setGames(initialGames)
  }, [initialGames])

  // Drag & Drop обработчик
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(games)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Обновляем sort_order для всех элементов
    const updatedGames = items.map((game, index) => ({
      ...game,
      sort_order: index + 1
    }))

    setGames(updatedGames)
    await saveOrder(updatedGames)
  }

  // Кнопки вверх/вниз
  const moveGame = async (gameId: number, direction: 'up' | 'down') => {
    const currentIndex = games.findIndex(g => g.id === gameId)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === games.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const items = Array.from(games)
    const [movedItem] = items.splice(currentIndex, 1)
    items.splice(newIndex, 0, movedItem)

    // Обновляем sort_order
    const updatedGames = items.map((game, index) => ({
      ...game,
      sort_order: index + 1
    }))

    setGames(updatedGames)
    await saveOrder(updatedGames)
  }

  // Сохранение порядка на сервер
  const saveOrder = async (updatedGames: Game[]) => {
    setSaving(true)
    setError(null)

    try {
      // Отправляем массив с новыми порядковыми номерами
      const updates = updatedGames.map(game => ({
        id: game.id,
        sort_order: game.sort_order
      }))

      await api.put('/admin/games/reorder', { games: updates })
      onGamesUpdate(updatedGames)

      console.log('✅ Порядок игр сохранен')
    } catch (error: any) {
      console.error('❌ Ошибка сохранения порядка:', error)
      setError('Ошибка сохранения порядка')
      // Откатываем изменения
      setGames(initialGames)
    } finally {
      setSaving(false)
    }
  }

  const getImageUrl = (url?: string) => {
    if (!url) return '/placeholder-game.jpg'
    if (url.startsWith('http')) return url
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
    const baseUrl = apiUrl.replace('/api', '')
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {saving && (
        <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-600 dark:text-blue-400">Сохранение порядка...</p>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="games">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {games.map((game, index) => (
                <Draggable key={game.id} draggableId={game.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4
                        ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}
                        ${!game.enabled ? 'opacity-60' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        {/* Drag Handle */}
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-5 h-5 text-zinc-400" />
                        </div>

                        {/* Порядковый номер */}
                        <div className="text-sm font-mono bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                          #{index + 1}
                        </div>

                        {/* Логотип */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-700 flex-shrink-0">
                          <img
                            src={getImageUrl(game.logo_url || game.banner_url)}
                            alt={game.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-game.jpg'
                            }}
                          />
                        </div>

                        {/* Название игры */}
                        <div className="flex-1">
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                            {game.name}
                          </h3>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            ID: {game.id} • Позиция: {game.sort_order}
                          </p>
                        </div>

                        {/* Статус */}
                        <div className="flex items-center gap-2">
                          {game.enabled ? (
                          <span title="Включена">
                            <Eye className="w-4 h-4 text-green-500" />
                          </span>
                        ) : (
                          <span title="Отключена">
                            <EyeOff className="w-4 h-4 text-red-500" />
                          </span>
                        )}
                        </div>

                        {/* Кнопки управления порядком */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveGame(game.id, 'up')}
                            disabled={index === 0 || saving}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Переместить вверх"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveGame(game.id, 'down')}
                            disabled={index === games.length - 1 || saving}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Переместить вниз"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Кнопка редактирования */}
                        <Link
                          href={`/admin/games/${game.id}/edit`}
                          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
        <p><strong>💡 Как использовать:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Перетаскивайте игры за иконку ⋮⋮ для изменения порядка</li>
          <li>Используйте кнопки ↑/↓ для точного перемещения</li>
          <li>Порядок сохраняется автоматически</li>
          <li>Игры отображаются на сайте в этом же порядке</li>
        </ul>
      </div>
    </div>
  )
}