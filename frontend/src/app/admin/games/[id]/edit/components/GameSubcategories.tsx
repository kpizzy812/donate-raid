// frontend/src/app/admin/games/[id]/edit/components/GameSubcategories.tsx
import { Plus, X } from 'lucide-react'
import { GameData, Subcategory } from '../hooks/useGameData'

interface Props {
  data: GameData
  onChange: (updates: Partial<GameData>) => void
  addSubcategory: () => void
  removeSubcategory: (index: number) => void
  updateSubcategory: (index: number, field: keyof Subcategory, value: any) => void
}

export function GameSubcategories({
  data,
  onChange,
  addSubcategory,
  removeSubcategory,
  updateSubcategory
}: Props) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Подкатегории игры</h2>
        <button
          type="button"
          onClick={addSubcategory}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить подкатегорию
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          Описание подкатегорий
        </label>
        <textarea
          className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          value={data.subcategoryDescription}
          onChange={e => onChange({ subcategoryDescription: e.target.value })}
          placeholder="Объяснение, что такое подкатегории в этой игре (например: регионы сервера, типы валют и т.п.)"
        />
      </div>

      {data.subcategories.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Подкатегории помогают организовать товары по группам
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Например: "Россия", "Глобал", "Европа" для мобильных игр
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.subcategories.map((subcategory, index) => (
            <div
              key={index}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-750"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                  Подкатегория #{index + 1}
                  {subcategory.id && (
                    <span className="text-xs text-zinc-500 ml-2">ID: {subcategory.id}</span>
                  )}
                </h4>
                <button
                  onClick={() => removeSubcategory(index)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                  title="Удалить подкатегорию"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Название подкатегории *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={subcategory.name}
                    onChange={e => updateSubcategory(index, 'name', e.target.value)}
                    placeholder="Россия"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Порядок сортировки
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={subcategory.sort_order}
                    onChange={e => updateSubcategory(index, 'sort_order', Number(e.target.value))}
                    min="0"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  Описание подкатегории
                </label>
                <textarea
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  value={subcategory.description}
                  onChange={e => updateSubcategory(index, 'description', e.target.value)}
                  placeholder="Описание для чего эта подкатегория..."
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subcategory.enabled}
                    onChange={e => updateSubcategory(index, 'enabled', e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Включена</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.subcategories.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Совет:</strong> Подкатегории позволяют группировать товары.
            Например, для Mobile Legends можно создать "Россия", "Глобал", "Индонезия".
          </p>
        </div>
      )}
    </div>
  )
}