// frontend/src/types/article.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ

export interface ArticleTag {
  id: number
  name: string
  slug: string
  color?: string
}

export interface ArticleRead {
  id: number
  slug: string
  title: string
  content: string
  category: string
  categories?: string[]  // Массив категорий (вычисляется)
  created_at: string
  updated_at?: string
  published_at?: string
  author_name?: string
  featured_image?: string  // Для совместимости (alias для featured_image_url)
  featured_image_url?: string  // Основное поле для URL изображения
  featured_image_alt?: string
  tags?: ArticleTag[]  // Массив объектов тегов
  tag_names?: string[]  // Массив названий тегов для совместимости
  published: boolean
  views?: number
  game_id?: number
  excerpt?: string
}

export interface ArticleCreate {
  title: string
  slug: string
  content: string
  category: string  // Основная категория
  categories?: string[]  // Массив всех категорий
  author_name?: string
  featured_image?: string  // Base64 изображение
  featured_image_url?: string
  featured_image_alt?: string
  tags?: string[]  // Массив названий тегов
  published?: boolean
  game_id?: number
  excerpt?: string
}

export interface ArticleUpdate {
  title?: string
  slug?: string
  content?: string
  category?: string
  categories?: string[]
  author_name?: string
  featured_image?: string  // Base64 изображение
  featured_image_url?: string
  featured_image_alt?: string
  tags?: string[]
  published?: boolean
  game_id?: number
  excerpt?: string
}

export type ArticleCategory =
  | 'Новости'
  | 'Гайды'
  | 'Промокоды'
  | 'Обзоры'
  | 'ПК Игры'
  | 'Мобильные игры'

// Константы для работы с категориями
export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  'Новости',
  'Гайды',
  'Промокоды',
  'Обзоры',
  'ПК Игры',
  'Мобильные игры'
]

// Утилитарные функции для работы со статьями
export const ArticleUtils = {
  /**
   * Получает изображение статьи с приоритетом
   */
  getArticleImage(article: ArticleRead): string | null {
    return article.featured_image_url ||
           article.featured_image ||
           this.getImageFromContent(article.content)
  },

  /**
   * Извлекает первое изображение из контента статьи
   */
  getImageFromContent(content: string): string | null {
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
    return imgMatch ? imgMatch[1] : null
  },

  /**
   * Усекает текст до указанной длины
   */
  truncateText(text: string, maxLength: number): string {
    const plainText = text.replace(/<[^>]*>/g, '')
    return plainText.length > maxLength ?
      plainText.slice(0, maxLength) + '...' :
      plainText
  },

  /**
   * Форматирует дату для отображения
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  /**
   * Рассчитывает примерное время чтения
   */
  getReadingTime(content: string): number {
    const plainText = content.replace(/<[^>]*>/g, '')
    const wordCount = plainText.split(/\s+/).length
    return Math.max(1, Math.round(wordCount / 200)) // 200 слов в минуту
  },

  /**
   * Генерирует slug из заголовка
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  },

  /**
   * Получает названия тегов из объектов тегов
   */
  getTagNames(tags?: ArticleTag[]): string[] {
    return tags ? tags.map(tag => tag.name) : []
  },

  /**
   * Разделяет теги на категории и обычные теги
   */
  separateTagsAndCategories(tags: string[]): { categories: string[], regularTags: string[] } {
    const categories = tags.filter(tag => ARTICLE_CATEGORIES.includes(tag as ArticleCategory))
    const regularTags = tags.filter(tag => !ARTICLE_CATEGORIES.includes(tag as ArticleCategory))

    return { categories, regularTags }
  }
}