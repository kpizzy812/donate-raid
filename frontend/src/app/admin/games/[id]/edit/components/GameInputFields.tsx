// frontend/src/app/admin/games/[id]/edit/components/GameInputFields.tsx
export function GameInputFields({ data, onChange }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <h2 className="text-lg font-semibold mb-4">Поля для ввода пользователем</h2>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm">
        Компонент полей ввода временно отключен.
        Сейчас загружено: {data.inputFields.length} полей
      </p>

      {data.inputFields.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.inputFields.map((field, index) => (
            <div key={index} className="p-3 bg-zinc-50 dark:bg-zinc-700 rounded text-sm">
              <strong>{field.label}</strong> ({field.name}) - {field.type}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}