// frontend/src/app/admin/games/[id]/edit/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useGameData } from './hooks/useGameData'
import { GameBasicInfo } from './components/GameBasicInfo'
import { GameImages } from './components/GameImages'
import { GameSubcategories } from './components/GameSubcategories'
import { GameInputFields } from './components/GameInputFields'
import { GameContent } from './components/GameContent'

export default function EditGamePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const {
    loading,
    saving,
    gameData,
    updateGameData,
    saveGame,
    // Функции управления подкатегориями
    addSubcategory,
    removeSubcategory,
    updateSubcategory,
    // Функции управления полями ввода
    addInputField,
    removeInputField,
    updateInputField
  } = useGameData(id)

  const handleSave = async () => {
    const success = await saveGame()
    if (success) {
      router.push('/admin/games')
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Загрузка данных игры...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Редактирование игры</h1>
        <span className="text-zinc-500 dark:text-zinc-400">ID: {id}</span>
      </div>

      <div className="space-y-6">
        <GameBasicInfo
          data={gameData}
          onChange={updateGameData}
        />

        <GameImages
          data={gameData}
          onChange={updateGameData}
        />

        <GameSubcategories
          data={gameData}
          onChange={updateGameData}
        />

        <GameInputFields
          data={gameData}
          onChange={updateGameData}
        />

        <GameContent
          data={gameData}
          onChange={updateGameData}
        />

        {/* Кнопки действий */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="px-6 py-3 bg-zinc-500 hover:bg-zinc-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !gameData.name.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}