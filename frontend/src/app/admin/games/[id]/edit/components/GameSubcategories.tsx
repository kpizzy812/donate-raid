// frontend/src/app/admin/games/[id]/edit/components/GameSubcategories.tsx
import { GameData } from '../hooks/useGameData'

interface Props {
  data: GameData
  onChange: (updates: Partial<GameData>) => void
}

export function GameSubcategories({ data, onChange }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <h2 className="text-lg font-semibold mb-4">Подкатегории игры</h2>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm">
        Компонент подкатегорий временно отключен.
        Сейчас загружено: {data.subcategories.length} подкатегорий
      </p>

      {data.subcategories.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.subcategories.map((sub, index) => (
            <div key={index} className="p-3 bg-zinc-50 dark:bg-zinc-700 rounded text-sm">
              <strong>{sub.name}</strong> - {sub.description} (порядок: {sub.sort_order})
            </div>
          ))}
        </div>
      )}
    </div>
  )
}