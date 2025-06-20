// frontend/src/app/game/[id]/page.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import ProductGrid from '@/components/ProductGrid'
import { toast } from 'sonner'
import { getImageUrl } from '@/lib/imageUtils'
import { ChevronDown, ChevronUp, HelpCircle, Info, FileText } from 'lucide-react'

interface InputField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea'
  required: boolean
  placeholder?: string
  help_text?: string
  options?: string[]
}

interface Product {
  id: number
  name: string
  price_rub: number
  old_price_rub?: number
  description?: string
  type: 'currency' | 'item' | 'service'
  subcategory?: string
  special_note?: string
  note_type: string
  input_fields?: InputField[]
  image_url?: string
  min_amount: number
  max_amount: number
  game_id: number
}

interface FAQItem {
  question: string
  answer: string
}

interface Product {
  id: number
  name: string
  price_rub: number
  old_price_rub?: number
  description?: string
  type: 'currency' | 'item' | 'service'
  subcategory?: string  // Оставляем для совместимости
  subcategory_id?: number  // Новое поле
  subcategory_name?: string  // Название подкатегории
  special_note?: string
  note_type: string
  input_fields?: InputField[]
  image_url?: string
  min_amount: number
  max_amount: number
  game_id: number
}

interface GameSubcategory {
  id: number
  game_id: number
  name: string
  description?: string
  sort_order: number
  enabled: boolean
  created_at: string
}

interface Game {
  id: number
  name: string
  banner_url?: string
  description?: string
  instructions?: string
  auto_support: boolean
  faq_content?: string
  logo_url?: string
  sort_order?: number
  enabled?: boolean
  subcategory_description?: string
  products: Product[]
  subcategories: GameSubcategory[]
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  useEffect(() => {
    loadGame()
  }, [id])

  const loadGame = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/games/${id}`)

      // Убеждаемся, что у всех продуктов есть game_id
      const gameData = {
        ...response.data,
        products: response.data.products?.map((product: Product) => ({
          ...product,
          game_id: parseInt(id as string)
        })) || []
      }

      setGame(gameData)
    } catch (error) {
      console.error('Ошибка загрузки игры:', error)
      toast.error('Ошибка загрузки игры')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product, userData: Record<string, any>) => {
    // При успешном добавлении в корзину переходим сразу в корзину
    router.push('/order/cart')
  }

  // Парсим FAQ из JSON строки
  const getFAQList = (): FAQItem[] => {
    if (!game?.faq_content) return []

    try {
      return JSON.parse(game.faq_content)
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Загрузка...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-500">Игра не найдена</p>
      </div>
    )
  }

  const bannerImageUrl = getImageUrl(game.banner_url)
  const faqList = getFAQList()

  return (
    <div className="py-6 space-y-6 max-w-6xl mx-auto px-4">
      {/* Баннер игры */}
      {bannerImageUrl && (
        <div className="rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-700">
          <img
            src={bannerImageUrl}
            alt={game.name}
            className="w-full h-48 md:h-64 object-cover"
            onError={(e) => {
              console.error('❌ Ошибка загрузки баннера игры:', bannerImageUrl)
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Информация об игре */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{game.name}</h1>
          {game.auto_support && (
            <span className="text-sm text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              ✅ Автоматическая доставка
            </span>
          )}
        </div>

        {game.description && (
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {game.description}
          </p>
        )}

        {/* Кнопки для инструкций и FAQ */}
        <div className="flex gap-3 flex-wrap">
          {game.instructions && (
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              {showInstructions ? 'Скрыть инструкции' : 'Показать инструкции'}
              {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {faqList.length > 0 && (
            <button
              onClick={() => setShowFAQ(!showFAQ)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {showFAQ ? 'Скрыть FAQ' : 'Показать FAQ'}
              {showFAQ ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Инструкции */}
        {showInstructions && game.instructions && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Инструкции
              </h3>
            </div>
            <div className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
              {game.instructions}
            </div>
          </div>
        )}

        {/* FAQ */}
        {showFAQ && faqList.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                Часто задаваемые вопросы
              </h3>
            </div>
            <div className="space-y-3">
              {faqList.map((faq, index) => (
                <div key={index} className="border border-purple-200 dark:border-purple-700 rounded-lg">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full text-left p-4 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-purple-800 dark:text-purple-200">
                      {faq.question}
                    </span>
                    {expandedFAQ === index ? (
                      <ChevronUp className="w-4 h-4 text-purple-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-purple-600" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-4 pb-4 text-purple-700 dark:text-purple-300 whitespace-pre-wrap">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Продукты */}
      {game.auto_support ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Доступные товары</h2>

          {game.products && game.products.length > 0 ? (
            <ProductGrid
              products={game.products}
              onAddToCart={handleAddToCart}
            />
          ) : (
            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-zinc-500">Товары для этой игры пока не добавлены</p>
            </div>
          )}
        </div>
      ) : (
        /* Ручная поддержка */
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⚡</span>
              <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">
                Ручная обработка заказов
              </h2>
            </div>

            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Для этой игры заказы обрабатываются вручную нашими операторами.
              Время выполнения: от 5 минут до 24 часов в зависимости от сложности заказа.
            </p>

            <button
              onClick={() => router.push('/manual-request')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Оставить заявку
            </button>
          </div>
        </div>
      )}
    </div>
  )
}