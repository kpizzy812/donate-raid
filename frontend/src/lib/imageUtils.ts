// frontend/src/lib/imageUtils.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
/**
 * Утилиты для работы с изображениями
 */

/**
 * Получает полный URL изображения из относительного пути
 */
export function getImageUrl(imagePath?: string): string | null {
  if (!imagePath) return null

  console.log('getImageUrl получил путь:', imagePath) // Отладка

  // Если URL уже полный, возвращаем как есть
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('URL уже полный:', imagePath)
    return imagePath
  }

  // ИСПРАВЛЕНО: получаем базовый URL без /api для статических файлов
  // Используем STATIC_FILES_BASE_URL как в backend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
  const baseUrl = apiUrl.replace('/api', '') // Убираем /api для статических файлов

  // Если путь начинается с /uploads, добавляем только base URL
  if (imagePath.startsWith('/uploads/')) {
    const fullUrl = `${baseUrl}${imagePath}`
    console.log('Полный URL с /uploads:', fullUrl)
    return fullUrl
  }

  // Если путь относительный, добавляем /uploads/ и base URL
  const cleanPath = imagePath.replace(/^\/+/, '') // Убираем ведущие слеши
  const fullUrl = `${baseUrl}/uploads/${cleanPath}`
  console.log('Полный URL относительный:', fullUrl)
  return fullUrl
}

/**
 * Извлекает первое изображение из HTML контента
 */
export function getImageFromContent(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
  return imgMatch ? imgMatch[1] : null
}

/**
 * Проверяет, является ли URL изображением
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.includes(ext))
}

/**
 * Получает заглушку для изображения
 */
export function getImagePlaceholder(text: string = 'No Image'): string {
  return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
      <rect width="400" height="300" fill="#1f2937"/>
      <text x="200" y="150" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `)}`
}