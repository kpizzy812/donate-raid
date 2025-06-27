// frontend/src/app/admin/games/[id]/edit/components/GameInputFields.tsx
import { Plus, X } from 'lucide-react'
import { GameData, InputField } from '../hooks/useGameData'

interface Props {
  data: GameData
  onChange: (updates: Partial<GameData>) => void
  addInputField: () => void
  removeInputField: (index: number) => void
  updateInputField: (index: number, field: keyof InputField, value: any) => void
}

export function GameInputFields({
  data,
  onChange,
  addInputField,
  removeInputField,
  updateInputField
}: Props) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Поля для ввода пользователем</h2>
        <button
          type="button"
          onClick={addInputField}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить поле
        </button>
      </div>

      {data.inputFields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Поля, которые пользователь должен заполнить при покупке товаров этой игры
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Можно привязать поля к конкретным подкатегориям или оставить общими для всей игры
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.inputFields.map((field, index) => (
            <div
              key={index}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-750"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                  Поле #{index + 1}
                  {field.id && (
                    <span className="text-xs text-zinc-500 ml-2">ID: {field.id}</span>
                  )}
                </h4>
                <button
                  onClick={() => removeInputField(index)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                  title="Удалить поле"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Название поля *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={field.name}
                    onChange={e => updateInputField(index, 'name', e.target.value)}
                    placeholder="player_id"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Отображаемое название *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={field.label}
                    onChange={e => updateInputField(index, 'label', e.target.value)}
                    placeholder="Player ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Подкатегория
                  </label>
                  <select
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={field.subcategory_id || ''}
                    onChange={e => updateInputField(index, 'subcategory_id', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Общее для всех подкатегорий</option>
                    {data.subcategories
                      .filter(sub => sub.enabled && sub.name.trim())
                      .map((subcategory, subIndex) => (
                        <option key={subcategory.id || subIndex} value={subcategory.id || -subIndex - 1}>
                          {subcategory.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Тип поля
                  </label>
                  <select
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={field.type}
                    onChange={e => updateInputField(index, 'type', e.target.value as InputField['type'])}
                  >
                    <option value="text">Текст</option>
                    <option value="email">Email</option>
                    <option value="password">Пароль</option>
                    <option value="number">Число</option>
                    <option value="select">Выпадающий список</option>
                    <option value="textarea">Многострочный текст</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={field.placeholder || ''}
                    onChange={e => updateInputField(index, 'placeholder', e.target.value)}
                    placeholder="Введите ваш Player ID"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  Текст подсказки
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={field.help_text || ''}
                  onChange={e => updateInputField(index, 'help_text', e.target.value)}
                  placeholder="Найдите Player ID в настройках игры"
                />
              </div>

              {field.type === 'select' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Варианты для выбора (каждый с новой строки)
                  </label>
                  <textarea
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={field.options?.join('\n') || ''}
                    onChange={e => updateInputField(index, 'options', e.target.value.split('\n').filter(opt => opt.trim()))}
                    placeholder="Россия&#10;Европа&#10;Азия"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Мин. длина
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={field.min_length || ''}
                    onChange={e => updateInputField(index, 'min_length', e.target.value ? Number(e.target.value) : undefined)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Макс. длина
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={field.max_length || ''}
                    onChange={e => updateInputField(index, 'max_length', e.target.value ? Number(e.target.value) : undefined)}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                    Regex валидация
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={field.validation_regex || ''}
                    onChange={e => updateInputField(index, 'validation_regex', e.target.value)}
                    placeholder="^[0-9]+$"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateInputField(index, 'required', e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Обязательное поле</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.inputFields.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Совет:</strong> Эти поля будут отображаться пользователю при покупке товаров.
            Например: "Player ID", "Сервер", "Регион", "Email" и т.п.
          </p>
        </div>
      )}
    </div>
  )
}