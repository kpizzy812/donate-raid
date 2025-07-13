// frontend/src/types/reviews.ts - ТИПЫ ДЛЯ ОТЗЫВОВ
export interface Review {
  id: number
  rating: number
  text: string
  game_name: string
  masked_email: string
  is_anonymous: boolean
  is_approved: boolean
  created_at: string
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface ReviewCreate {
  order_id: number
  rating: number
  text: string
  email?: string
  is_anonymous?: boolean
}

export interface ReviewFilter {
  rating?: number
  game_name?: string
  approved_only?: boolean
}