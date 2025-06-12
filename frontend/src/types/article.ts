// frontend/src/types/article.ts
export interface ArticleRead {
  id: number
  slug: string
  title: string
  content: string
  category: string
  categories?: string[]
  created_at: string
  author_name?: string
  featured_image?: string
  tags?: string[]
  published: boolean
  views?: number
  game_title?: string
}

export interface ArticleCreate {
  title: string
  slug: string
  content: string
  category: string
  categories?: string[]
  author_name?: string
  featured_image?: string
  tags?: string[]
  published?: boolean
  game_title?: string
}

export type ArticleCategory =
  | 'Новости'
  | 'Гайды'
  | 'Промокоды'
  | 'Обзоры'
  | 'ПК Игры'
  | 'Мобильные игры'