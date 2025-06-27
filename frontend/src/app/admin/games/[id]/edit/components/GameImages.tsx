// frontend/src/app/admin/games/[id]/edit/components/GameImages.tsx
import { useState } from 'react'
import { Upload, ImageIcon, X } from 'lucide-react'
import { GameData } from '../hooks/useGameData'

interface Props {
  data: GameData
  onChange: (updates: Partial<GameData>) => void
}

export function GameImages({ data, onChange }: Props) {
  const [bannerUploading, setBannerUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  const uploadImage = async (file: File, type: 'banner' | 'logo') => {
    const setter = type === 'banner' ? setBannerUploading : setLogoUploading
    setter(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subfolder', 'games')

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/admin/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) throw new Error('Ошибка загрузки')

      const result = await response.json()
      if (result.success) {
        if (type === 'banner') {
          onChange({ bannerUrl: result.file_url })
        } else {
          onChange({ logoUrl: result.file_url })
        }
        console.log(`✅ ${type} загружен:`, result.file_url)
      } else {
        throw new Error(result.error || 'Ошибка загрузки')
      }
    } catch (error: any) {
      console.error(`Ошибка загрузки ${type}:`, error)
      alert(`Ошибка загрузки ${type === 'banner' ? 'баннера' : 'логотипа'}`)
    } finally {
      setter(false)
    }
  }

  const handleImageUpload = (type: 'banner' | 'logo') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) uploadImage(file, type)
    }
    input.click()
  }

  const getImageUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
    const baseUrl = apiUrl.replace('/api', '')
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
  }

  return (
    <>
      {/* Баннер игры */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold mb-4">Баннер игры</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Горизонтальное изображение для отображения на странице игры
        </p>

        {data.bannerUrl ? (
          <div className="relative inline-block">
            <img
              src={getImageUrl(data.bannerUrl)}
              alt="Баннер игры"
              className="w-full max-w-md h-32 object-cover rounded-lg border border-zinc-300 dark:border-zinc-600 shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                onChange({ bannerUrl: '' })
              }}
            />
            <button
              onClick={() => onChange({ bannerUrl: '' })}
              className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleImageUpload('banner')}
            disabled={bannerUploading}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg p-8 w-full max-w-md h-32 text-center transition-colors disabled:opacity-50 flex flex-col items-center justify-center"
          >
            {bannerUploading ? (
              <Upload className="w-8 h-8 text-zinc-400 animate-spin" />
            ) : (
              <ImageIcon className="w-8 h-8 text-zinc-400" />
            )}
            <span className="text-zinc-600 dark:text-zinc-400 mt-2">
              {bannerUploading ? 'Загрузка...' : 'Нажмите для загрузки баннера'}
            </span>
          </button>
        )}
      </div>

      {/* Логотип игры */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold mb-4">Логотип игры</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Квадратное изображение для отображения на главной странице и в карточке игры
        </p>

        {data.logoUrl ? (
          <div className="relative inline-block">
            <img
              src={getImageUrl(data.logoUrl)}
              alt="Логотип игры"
              className="w-32 h-32 object-cover rounded-lg border border-zinc-300 dark:border-zinc-600 shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                onChange({ logoUrl: '' })
              }}
            />
            <button
              onClick={() => onChange({ logoUrl: '' })}
              className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleImageUpload('logo')}
            disabled={logoUploading}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg p-8 w-32 h-32 text-center transition-colors disabled:opacity-50 flex flex-col items-center justify-center"
          >
            {logoUploading ? (
              <Upload className="w-6 h-6 text-zinc-400 animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6 text-zinc-400" />
            )}
            <span className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
              {logoUploading ? 'Загрузка...' : 'Загрузить'}
            </span>
          </button>
        )}
      </div>
    </>
  )
}