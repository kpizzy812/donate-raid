// frontend/src/app/admin/games/[id]/edit/components/GameBasicInfo.tsx
import { GameData } from '../hooks/useGameData'

interface Props {
  data: GameData
  onChange: (updates: Partial<GameData>) => void
}

export function GameBasicInfo({ data, onChange }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            Название игры *
          </label>
          <input
            type="text"
            className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Название игры"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            Порядок сортировки
          </label>
          <input
            type="number"
            className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={data.sortOrder}
            onChange={e => onChange({ sortOrder: Number(e.target.value) })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          Описание игры
        </label>
        <textarea
          className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          value={data.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Краткое описание игры для отображения в карточке..."
        />
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
          placeholder="Объяснение что такое подкатегории для пользователей..."
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={data.autoSupport}
            onChange={e => onChange({ autoSupport: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Автоматическая поддержка</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={e => onChange({ enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Игра включена</span>
        </label>
      </div>
    </div>
  )
}