// frontend/src/components/admin/SubcategoriesManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

interface GameSubcategory {
  id: number
  game_id: number
  name: string
  description?: string
  sort_order: number
  enabled: boolean
  created_at: string
}

interface SubcategoriesManagerProps {
  gameId: number
  onSubcategoriesChange?: (subcategories: GameSubcategory[]) => void
}

export default function SubcategoriesManager({ gameId, onSubcategoriesChange }: SubcategoriesManagerProps) {
  const [subcategories, setSubcategories] = useState<GameSubcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 0,
    enabled: true
  })

  useEffect(() => {
    loadSubcategories()
  }, [gameId])

  const loadSubcategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${gameId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Ошибка загрузки подкатегорий')
      }

      const data = await response.json()
      setSubcategories(data)
      onSubcategoriesChange?.(data)
    } catch (error) {
      console.error('Ошибка загрузки подкатегорий:', error)
      toast.error('Ошибка загрузки подкатегорий')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/game/${gameId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            game_id: gameId
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Ошибка создания подкатегории')
      }

      toast.success('Подкатегория создана!')
      setShowCreateForm(false)
      setFormData({ name: '', description: '', sort_order: 0, enabled: true })
      loadSubcategories()
    } catch (error: any) {
      console.error('Ошибка создания подкатегории:', error)
      toast.error(error.message || 'Ошибка создания подкатегории')
    }
  }

  const handleUpdate = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Ошибка обновления подкатегории')
      }

      toast.success('Подкатегория обновлена!')
      setEditingId(null)
      setFormData({ name: '', description: '', sort_order: 0, enabled: true })
      loadSubcategories()
    } catch (error: any) {
      console.error('Ошибка обновления подкатегории:', error)
      toast.error(error.message || 'Ошибка обновления подкатегории')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Удалить подкатегорию "${name}"?`)) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subcategories/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Ошибка удаления подкатегории')
      }

      toast.success('Подкатегория удалена!')
      loadSubcategories()
    } catch (error: any) {
      console.error('Ошибка удаления подкатегории:', error)
      toast.error(error.message || 'Ошибка удаления подкатегории')
    }
  }

  const startEdit = (subcategory: GameSubcategory) => {
    setEditingId(subcategory.id)
    setFormData({
      name: subcategory.name,
      description: subcategory.description || '',
      sort_order: subcategory.sort_order,
      enabled: subcategory.enabled
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowCreateForm(false)
    setFormData({ name: '', description: '', sort_order: 0, enabled: true })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Подкатегории товаров</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Создайте подкатегории для группировки товаров (например: "Россия", "Глобал", "Индонезия")
      </p>

      {/* Форма создания */}
      {showCreateForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-3">Новая подкатегория</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1">Название *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                placeholder="Например: Россия"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Порядок сортировки</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              rows={2}
              placeholder="Описание подкатегории..."
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Активна</span>
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              disabled={!formData.name.trim()}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Создать
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список подкатегорий */}
      <div className="space-y-2">
        {subcategories.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            Подкатегории не созданы
          </div>
        ) : (
          subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className={`border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 ${
                !subcategory.enabled ? 'opacity-60' : ''
              }`}
            >
              {editingId === subcategory.id ? (
                /* Форма редактирования */
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Название *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Порядок сортировки</label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.enabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Активна</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(subcategory.id)}
                      disabled={!formData.name.trim()}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Сохранить
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                /* Отображение подкатегории */
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{subcategory.name}</h4>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                        #{subcategory.sort_order}
                      </span>
                      {!subcategory.enabled && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-1 rounded">
                          Неактивна
                        </span>
                      )}
                    </div>
                    {subcategory.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {subcategory.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(subcategory)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subcategory.id, subcategory.name)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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