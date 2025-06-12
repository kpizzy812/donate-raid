// frontend/src/app/reviews/page.tsx
'use client'

import { useState } from 'react'
import { Star, User, Calendar, MessageSquare } from 'lucide-react'

const reviewsData = [
  {
    id: 1,
    username: 'PlayerOne',
    game: 'Genshin Impact',
    rating: 5,
    date: '2024-06-10',
    text: 'Очень быстрая доставка! Заказал 3000 примогемов, получил за 10 минут. Отличный сервис, буду пользоваться еще!',
    verified: true
  },
  {
    id: 2,
    username: 'GamerPro2024',
    game: 'Honkai: Star Rail',
    rating: 5,
    date: '2024-06-09',
    text: 'Все супер! Поддержка отвечает быстро, цены адекватные. Пополнял звездную валюту несколько раз — всегда все четко.',
    verified: true
  },
  {
    id: 3,
    username: 'MobileGamer',
    game: 'PUBG Mobile',
    rating: 4,
    date: '2024-06-08',
    text: 'Хороший сервис, но хотелось бы больше способов оплаты. В остальном все отлично — UC пришли моментально.',
    verified: false
  },
  {
    id: 4,
    username: 'РыцарьСвета',
    game: 'Lost Ark',
    rating: 5,
    date: '2024-06-07',
    text: 'Пополнял кристаллы уже раз 5. Всегда все быстро и без проблем. Цены лучше чем в Steam!',
    verified: true
  },
  {
    id: 5,
    username: 'CasualPlayer',
    game: 'Clash of Clans',
    rating: 5,
    date: '2024-06-06',
    text: 'Первый раз пользовался подобным сервисом, было страшновато. Но все прошло отлично! Гемы получил быстро, аккаунт в порядке.',
    verified: true
  },
  {
    id: 6,
    username: 'ProGamer777',
    game: 'Free Fire',
    rating: 4,
    date: '2024-06-05',
    text: 'Нормальный сервис. Диаманты пришли через 20 минут. Поддержка вежливая, но хотелось бы еще быстрее.',
    verified: false
  },
  {
    id: 7,
    username: 'Animelover',
    game: 'Blue Archive',
    rating: 5,
    date: '2024-06-04',
    text: 'Долго искал где можно пополнить баланс в этой игре. Тут сделали все быстро и качественно! Рекомендую.',
    verified: true
  },
  {
    id: 8,
    username: 'FPSMaster',
    game: 'Valorant',
    rating: 5,
    date: '2024-06-03',
    text: 'Покупал Valorant Points для покупки скинов. Все пришло моментально, цена приемлемая. Спасибо!',
    verified: true
  }
]

interface ReviewCardProps {
  review: typeof reviewsData[0]
}

function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{review.username}</span>
              {review.verified && (
                <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                  Проверен
                </span>
              )}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">{review.game}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-zinc-300 dark:text-zinc-600'}
            />
          ))}
        </div>
      </div>

      {/* Review text */}
      <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">
        {review.text}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          {new Date(review.date).toLocaleDateString('ru-RU')}
        </div>
      </div>
    </div>
  )
}

export default function ReviewsPage() {
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3'>('all')

  const filteredReviews = reviewsData.filter(review => {
    if (filter === 'all') return true
    return review.rating === parseInt(filter)
  })

  const averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
  const totalReviews = reviewsData.length

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Отзывы клиентов</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Честные отзывы наших пользователей о качестве услуг
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-zinc-300'}
                />
              ))}
            </div>
            <div className="text-lg font-semibold">{averageRating.toFixed(1)} из 5</div>
            <div className="text-sm text-zinc-500">{totalReviews} отзывов</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-sm text-zinc-500">Довольных клиентов</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">15 мин</div>
            <div className="text-sm text-zinc-500">Среднее время доставки</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Все отзывы
        </button>
        <button
          onClick={() => setFilter('5')}
          className={`px-4 py-2 rounded-md transition flex items-center gap-1 ${
            filter === '5'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Star size={16} className="text-yellow-400 fill-current" />5
        </button>
        <button
          onClick={() => setFilter('4')}
          className={`px-4 py-2 rounded-md transition flex items-center gap-1 ${
            filter === '4'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Star size={16} className="text-yellow-400 fill-current" />4
        </button>
        <button
          onClick={() => setFilter('3')}
          className={`px-4 py-2 rounded-md transition flex items-center gap-1 ${
            filter === '3'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Star size={16} className="text-yellow-400 fill-current" />3
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {filteredReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Call to action */}
      <div className="text-center bg-blue-50 dark:bg-blue-950 rounded-xl p-8">
        <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Поделитесь своим опытом</h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Ваше мнение важно для нас и поможет другим пользователям
        </p>
        <a
          href="/support"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition"
        >
          Оставить отзыв
        </a>
      </div>
    </main>
  )
}