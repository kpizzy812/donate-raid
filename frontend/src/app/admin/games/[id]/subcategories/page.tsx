// frontend/src/app/admin/games/[id]/subcategories/page.tsx - УПРАВЛЕНИЕ ПОДКАТЕГОРИЯМИ
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

interface Game {
  id: number
  name: string
}

interface Subcategory {
  id?: number
  name: string
  description: string
  sort_order: number
  enabled: boolean
  game_id?: number
}

export default function GameSubcategoriesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const gameId = parseInt(id)

  const [game, setGame] = useState<Game | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newSubcategory, setNewSubcategory] = useState<Subcategory>({
    name: '',
    description: '',
    sort_order: 0,
    enabled: true
  })
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    loadGame()
    loadSubcategories()
  }, [gameId])

  const loadGame = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games/${gameId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setGame(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки игры:', error)
    }
  }

  const loadSubcategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${gameId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setSubcategories(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки подкатегорий:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newSubcategory.name.trim()) {
      alert('Введите название подкатегории')
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${gameId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...newSubcategory,
            game_id: gameId,
            sort_order: subcategories.length
          })
        }
      )

      if (response.ok) {
        setNewSubcategory({ name: '', description: '', sort_order: 0, enabled: true })
        setShowNewForm(false)
        loadSubcategories()
      } else {
        const error = await response.json()
        alert(`Ошибка создания: ${error.detail}`)
      }
    } catch (error) {
      console.error('Ошибка создания подкатегории:', error)
      alert('Ошибка создания подкатегории')
    }
  }

  const handleUpdate = async (subcategory: Subcategory) => {
    if (!subcategory.name.trim()) {
      alert('Введите название подкатегории')
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/${subcategory.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(subcategory)
        }
      )

      if (response.ok) {
        setEditingId(null)
        loadSubcategories()
      } else {
        const error = await response.json()
        alert(`Ошибка обновления: ${error.detail}`)
      }
    } catch (error) {
      console.error('Ошибка обновления подкатегории:', error)
      alert('Ошибка обновления подкатегории')
    }
  }

  const handleDelete = async (subcategoryId: number) => {
    if (!confirm('Удалить подкатегорию? Все товары в этой подкатегории останутся без категории.')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/${subcategoryId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (response.ok) {
        loadSubcategories()
      } else {
        const error = await response.json()
        alert(`Ошибка удаления: ${error.detail}`)
      }
    } catch (error) {
      console.error('Ошибка удаления подкатегории:', error)
      alert('Ошибка удаления подкатегории')
    }
  }

  const updateSubcategory = (index: number, field: keyof Subcategory, value: any) => {
    const updated = [...subcategories]
    updated[index] = { ...updated[index], [field]: value }
    setSubcategories(updated)
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Подкатегории</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{game?.name}</p>
        </div>
        <button
          onClick={() => router.push('/admin/games')}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Назад к играм
        </button>
      </div>

      {/* Кнопка добавления */}
      <div className="mb-6">
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить подкатегорию
        </button>
      </div>

      {/* Форма создания новой подкатегории */}
      {showNewForm && (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700 mb-6">
          <h3 className="text-lg font-semibold mb-4">Новая подкатегория</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название *</label>
              <input
                type="text"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                value={newSubcategory.name}
                onChange={e => setNewSubcategory({...newSubcategory, name: e.target.value})}
                placeholder="Россия, Глобал, Индонезия..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Порядок сортировки</label>
              <input
                type="number"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                value={newSubcategory.sort_order}
                onChange={e => setNewSubcategory({...newSubcategory, sort_order: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
              className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
              rows={3}
              value={newSubcategory.description}
              onChange={e => setNewSubcategory({...newSubcategory, description: e.target.value})}
              placeholder="Дополнительная информация о подкатегории..."
            />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newSubcategory.enabled}
                onChange={e => setNewSubcategory({...newSubcategory, enabled: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm">Включена</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Создать
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="bg-zinc-500 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список подкатегорий */}
      <div className="space-y-4">
        {subcategories.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2">Нет подкатегорий</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Создайте первую подкатегорию для организации товаров
            </p>
          </div>
        ) : (
          subcategories.map((subcategory, index) => (
            <div key={subcategory.id} className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {editingId === subcategory.id ? (
                // Режим редактирования
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Название *</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                        value={subcategory.name}
                        onChange={e => updateSubcategory(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Порядок сортировки</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                        value={subcategory.sort_order}
                        onChange={e => updateSubcategory(index, 'sort_order', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Описание</label>
                    <textarea
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                      rows={3}
                      value={subcategory.description}
                      onChange={e => updateSubcategory(index, 'description', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={subcategory.enabled}
                        onChange={e => updateSubcategory(index, 'enabled', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Включена</span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdate(subcategory)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-zinc-500 hover:bg-zinc-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                // Режим просмотра
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{subcategory.name}</h3>
                      {subcategory.description && (
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1">{subcategory.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(subcategory.id!)}
                        className="text-blue-600 hover:text-blue-700 p-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subcategory.id!)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>Порядок: {subcategory.sort_order}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      subcategory.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {subcategory.enabled ? 'Включена' : 'Отключена'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}