// frontend/src/app/referrals/page.tsx - НОВАЯ СТРАНИЦА
'use client'

import { useState, useEffect } from 'react'
import { Copy, Users, DollarSign, TrendingUp, Gift, Share2 } from 'lucide-react'

interface ReferralStats {
  referral_code: string
  referral_link: string
  total_referrals: number
  total_earned: number
  referral_percentage: number
}

interface ReferralEarning {
  id: number
  amount: number
  percentage: number
  order_id: number
  referred_username: string | null
  created_at: string
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [earnings, setEarnings] = useState<ReferralEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('access_token')

      // Получаем статистику
      const statsResponse = await fetch('/api/referrals/my-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Получаем историю выплат
      const earningsResponse = await fetch('/api/referrals/my-earnings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const earningsData = await earningsResponse.json()
      setEarnings(earningsData)

    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = async () => {
    if (stats?.referral_link) {
      await navigator.clipboard.writeText(stats.referral_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            Реферальная программа
          </h1>
          <p className="text-zinc-400">
            Приглашайте друзей и получайте {stats?.referral_percentage}% с их покупок
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold">Приглашено</h3>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {stats?.total_referrals || 0}
            </div>
            <p className="text-zinc-400 text-sm">пользователей</p>
          </div>

          <div className="bg-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold">Заработано</h3>
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              ₽{stats?.total_earned?.toFixed(2) || '0.00'}
            </div>
            <p className="text-zinc-400 text-sm">всего</p>
          </div>

          <div className="bg-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold">Процент</h3>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {stats?.referral_percentage || 0}%
            </div>
            <p className="text-zinc-400 text-sm">с покупок</p>
          </div>
        </div>

        {/* Реферальная ссылка */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Ваша реферальная ссылка
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={stats?.referral_link || ''}
              readOnly
              className="flex-1 bg-zinc-700 rounded px-4 py-2 font-mono text-sm"
            />
            <button
              onClick={copyReferralLink}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>

          <div className="bg-zinc-700 rounded p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Gift className="w-4 h-4 text-yellow-400" />
              Как это работает:
            </h3>
            <ul className="text-sm text-zinc-300 space-y-1">
              <li>• Поделитесь ссылкой с друзьями</li>
              <li>• Когда они зарегистрируются и сделают покупку</li>
              <li>• Вы получите {stats?.referral_percentage}% от суммы их заказа</li>
              <li>• Деньги автоматически зачисляются на ваш баланс</li>
            </ul>
          </div>
        </div>

        {/* История выплат */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">История реферальных выплат</h2>

          {earnings.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Пока нет реферальных выплат</p>
              <p className="text-sm">Приглашайте друзей, чтобы начать зарабатывать</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <div key={earning.id} className="bg-zinc-700 rounded p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-green-400">
                      +₽{earning.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-zinc-400">
                      От пользователя: {earning.referred_username || 'Неизвестно'}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Заказ #{earning.order_id} • {earning.percentage}%
                    </div>
                  </div>
                  <div className="text-right text-sm text-zinc-400">
                    {formatDate(earning.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}