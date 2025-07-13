'use client'

import { useState, useEffect } from 'react'
import { Star, User, Calendar, MessageSquare } from 'lucide-react'
import { fetchReviews, fetchReviewsStats } from '@/lib/api'
import type { Review, ReviewStats } from '@/types/reviews'

interface ReviewCardProps {
  review: Review
}

function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 sm:p-6 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm sm:text-base truncate">
                {review.masked_email}
              </span>
              {!review.is_anonymous && (
                <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  Проверен
                </span>
              )}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{review.game_name}</div>
          </div>
        </div>

        {/* Звезды - фиксированная ширина и контейнер */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`${
                i < review.rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-zinc-300 dark:text-zinc-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Review text */}
      <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed text-sm sm:text-base">
        {review.text}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span className="text-xs sm:text-sm">
            {new Date(review.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ReviewsPage() {
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3'>('all')
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка отзывов
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true)
        setError(null)

        // Параметры фильтрации
        const params: any = {}
        if (filter !== 'all') {
          params.rating = parseInt(filter)
        }

        // Загружаем отзывы и статистику параллельно
        const [reviewsData, statsData] = await Promise.all([
          fetchReviews(params),
          fetchReviewsStats()
        ])

        setReviews(reviewsData)
        setStats(statsData)

      } catch (err) {
        console.error('Ошибка загрузки отзывов:', err)
        setError('Ошибка загрузки отзывов')
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [filter])

  // Если загрузка
  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Загрузка отзывов...</p>
        </div>
      </main>
    )
  }

  // Если ошибка
  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          >
            Попробовать снова
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Отзывы клиентов</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm sm:text-base">
          Честные отзывы наших пользователей о качестве услуг
        </p>

        {/* Stats */}
        {stats && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.round(stats.average_rating) ? 'text-yellow-400 fill-current' : 'text-zinc-300'}
                  />
                ))}
              </div>
              <div className="text-lg font-semibold">{stats.average_rating.toFixed(1)} из 5</div>
              <div className="text-sm text-zinc-500">{stats.total_reviews} отзывов</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.total_reviews > 0 ? Math.round((stats.rating_distribution[4] + stats.rating_distribution[5]) / stats.total_reviews * 100) : 0}%
              </div>
              <div className="text-sm text-zinc-500">Довольных клиентов</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">15 мин</div>
              <div className="text-sm text-zinc-500">Среднее время доставки</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 sm:px-4 py-2 rounded-md transition text-sm ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Все отзывы
        </button>
        <button
          onClick={() => setFilter('5')}
          className={`px-3 sm:px-4 py-2 rounded-md transition flex items-center gap-1 text-sm ${
            filter === '5'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Star size={16} className="text-yellow-400 fill-current" />5
        </button>
        <button
          onClick={() => setFilter('4')}
          className={`px-3 sm:px-4 py-2 rounded-md transition flex items-center gap-1 text-sm ${
            filter === '4'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Star size={16} className="text-yellow-400 fill-current" />4
        </button>
        <button
          onClick={() => setFilter('3')}
          className={`px-3 sm:px-4 py-2 rounded-md transition flex items-center gap-1 text-sm ${
            filter === '3'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Star size={16} className="text-yellow-400 fill-current" />3
        </button>
      </div>

      {/* Reviews Grid */}
      {reviews.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
            {filter === 'all' ? 'Пока нет отзывов' : `Нет отзывов с рейтингом ${filter}`}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-500">
            {filter === 'all'
              ? 'Станьте первым, кто оставит отзыв о нашем сервисе!'
              : 'Попробуйте изменить фильтр или оставьте первый отзыв'
            }
          </p>
        </div>
      )}

      {/* Call to action */}
      <div className="text-center bg-blue-50 dark:bg-blue-950 rounded-xl p-6 sm:p-8">
        <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Поделитесь своим опытом</h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm sm:text-base">
          Ваше мнение важно для нас и поможет другим пользователям
        </p>
        <a
          href="/orders"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition text-sm sm:text-base"
        >
          Мои заказы
        </a>
      </div>
    </main>
  )
}