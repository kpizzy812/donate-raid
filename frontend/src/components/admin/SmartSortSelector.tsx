// frontend/src/components/admin/SmartSortSelector.tsx
'use client'

interface SortableItem {
  id: number
  name: string
  sort_order: number
}

interface Props {
  label: string
  items: SortableItem[]  // Существующие элементы для показа позиций
  currentItemId?: number  // ID текущего элемента (при редактировании)
  value: number  // Текущее значение sort_order
  onChange: (newSortOrder: number) => void
  placeholder?: string
}

export function SmartSortSelector({
  label,
  items,
  currentItemId,
  value,
  onChange,
  placeholder = "Выберите позицию"
}: Props) {
  // Фильтруем текущий элемент из списка (при редактировании)
  const otherItems = items.filter(item => item.id !== currentItemId)

  // Сортируем по порядку
  const sortedItems = [...otherItems].sort((a, b) => a.sort_order - b.sort_order)

  // Генерируем опции для выбора
  const generateOptions = () => {
    const options = []

    // Опция "В начало" (позиция 1)
    options.push({
      value: 1,
      label: "🔝 В начало (первая позиция)",
      description: sortedItems.length > 0 ? `Перед "${sortedItems[0]?.name}"` : "Будет первым элементом"
    })

    // Опции "После каждого элемента"
    sortedItems.forEach((item, index) => {
      const nextItem = sortedItems[index + 1]
      const newPosition = item.sort_order + 1

      options.push({
        value: newPosition,
        label: `📍 После "${item.name}"`,
        description: nextItem
          ? `Между "${item.name}" и "${nextItem.name}"`
          : "В конец списка"
      })
    })

    // Если список пустой, предлагаем позицию 1
    if (sortedItems.length === 0) {
      return [{
        value: 1,
        label: "🎯 Первый элемент",
        description: "Будет единственным элементом"
      }]
    }

    return options
  }

  const options = generateOptions()

  // Находим текущую выбранную опцию
  const currentOption = options.find(opt => opt.value === value) || options[0]

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
        {label}
      </label>

      {/* Показываем текущий порядок */}
      {sortedItems.length > 0 && (
        <div className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            📋 Текущий порядок:
          </p>
          <div className="space-y-1">
            {sortedItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">
                  #{item.sort_order}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {item.name}
                </span>
                {currentItemId === item.id && (
                  <span className="text-blue-600 dark:text-blue-400 text-xs">
                    (текущий)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Селектор позиции */}
      <select
        className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Описание выбранной позиции */}
      {currentOption && value > 0 && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          💡 {currentOption.description}
        </p>
      )}

      {/* Предпросмотр нового порядка */}
      {value > 0 && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            🔮 Предпросмотр нового порядка:
          </p>
          <div className="space-y-1">
            {generatePreview().map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
                  #{index + 1}
                </span>
                <span className={`${item.isNew ? 'font-bold text-blue-700 dark:text-blue-300' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  {item.name}
                </span>
                {item.isNew && (
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    НОВАЯ ПОЗИЦИЯ
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Функция для генерации предпросмотра
  function generatePreview() {
    const preview = []

    // Добавляем все существующие элементы
    sortedItems.forEach(item => {
      preview.push({ ...item, isNew: false })
    })

    // Добавляем новый элемент на нужную позицию
    const newItem = {
      id: currentItemId || -1,
      name: currentItemId ? "Этот элемент" : "Новый элемент",
      sort_order: value,
      isNew: true
    }

    preview.push(newItem)

    // Сортируем по новым позициям
    const sorted = preview.sort((a, b) => {
      if (a.sort_order === b.sort_order) {
        return a.isNew ? 1 : -1  // Новый элемент идет после существующих с такой же позицией
      }
      return a.sort_order - b.sort_order
    })

    return sorted
  }
}