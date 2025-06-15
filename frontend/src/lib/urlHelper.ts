// frontend/src/lib/urlHelper.ts
/**
 * Вспомогательная функция для правильного формирования URL
 * Убирает /api из NEXT_PUBLIC_API_URL для статических файлов
 */
export function getStaticBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
  return apiUrl.replace('/api', '')
}

/**
 * Быстрая функция для формирования URL изображения
 */
export function makeImageUrl(imagePath?: string): string | null {
  if (!imagePath) return null

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  const baseUrl = getStaticBaseUrl()
  return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`
}