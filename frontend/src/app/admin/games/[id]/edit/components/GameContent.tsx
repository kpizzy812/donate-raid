import { GameData } from '../hooks/useGameData'

interface Props {
  data: GameData
  onChange: (updates: Partial<GameData>) => void
}

export function GameContent({ data, onChange }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <h2 className="text-lg font-semibold mb-4">Контент</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          Инструкции
        </label>
        <textarea
          className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={5}
          value={data.instructions}
          onChange={e => onChange({ instructions: e.target.value })}
          placeholder="Подробные инструкции для игры..."
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          FAQ (JSON формат)
        </label>
        <textarea
          className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          rows={6}
          value={data.faq}
          onChange={e => onChange({ faq: e.target.value })}
          placeholder='[{"question": "Вопрос", "answer": "Ответ"}]'
        />
      </div>
    </div>
  )
}