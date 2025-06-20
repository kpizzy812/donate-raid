// frontend/src/app/game/[id]/page.tsx - ПЕРЕРАБОТАННАЯ ВЕРСИЯ С ТАБАМИ ПОДКАТЕГОРИЙ
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import ProductGrid from '@/components/ProductGrid'
import { toast } from 'sonner'
import { getImageUrl } from '@/lib/imageUtils'
import { ChevronDown, ChevronUp, HelpCircle, FileText, AlertCircle } from 'lucide-react'

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
  subcategory_id?: number
  subcategory_name?: string
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
  const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null)

  useEffect(() => {
    loadGame()
  }, [id])

  const loadGame = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/games/${id}`)

      const gameData = {
        ...response.data,
        products: response.data.products?.map((product: Product) => ({
          ...product,
          game_id: parseInt(id as string)
        })) || []
      }

      setGame(gameData)

      // Устанавливаем первую активную подкатегорию
      if (gameData.subcategories && gameData.subcategories.length > 0) {
        setActiveSubcategory(gameData.subcategories[0].id)
      }
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

  // Фильтруем товары по активной подкатегории
  const getFilteredProducts = () => {
    if (!game?.products) return []

    if (activeSubcategory === null) {
      return game.products
    }

    return game.products.filter(product =>
      product.subcategory_id === activeSubcategory
    )
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

  const logoImageUrl = getImageUrl(game.logo_url)
  const faqList = getFAQList()
  const filteredProducts = getFilteredProducts()

  return (
    <div className="py-6 space-y-6 max-w-6xl mx-auto px-4">
      {/* Шапка игры - квадратная картинка + описание */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-start gap-6">
          {/* Квадратная картинка игры */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={game.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('❌ Ошибка загрузки лого игры:', logoImageUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-2xl md:text-3xl">🎮</span>
              </div>
            )}
          </div>

          {/* Информация об игре */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold">{game.name}</h1>
              {game.auto_support && (
                <span className="text-sm text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full flex items-center gap-1">
                  ✅ Автоматическая доставка
                </span>
              )}
            </div>

            {game.description && (
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                {game.description}
              </p>
            )}

            {/* Кнопки для инструкций и FAQ */}
            <div className="flex gap-3 flex-wrap">
              {game.instructions && (
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  {showInstructions ? 'Скрыть инструкции' : 'Показать инструкции'}
                  {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}

              {faqList.length > 0 && (
                <button
                  onClick={() => setShowFAQ(!showFAQ)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showFAQ ? 'Скрыть FAQ' : 'Показать FAQ'}
                  {showFAQ ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Инструкции (раскрывающиеся) */}
      {showInstructions && game.instructions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Инструкции
          </h3>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-blue-800 dark:text-blue-200">{game.instructions}</p>
          </div>
        </div>
      )}

      {/* FAQ (раскрывающиеся) */}
      {showFAQ && faqList.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Часто задаваемые вопросы
          </h3>
          <div className="space-y-3">
            {faqList.map((faq, index) => (
              <div key={index} className="border border-purple-200 dark:border-purple-700 rounded-lg">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full text-left p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-purple-900 dark:text-purple-100">{faq.question}</span>
                  {expandedFAQ === index ?
                    <ChevronUp className="w-4 h-4 text-purple-600" /> :
                    <ChevronDown className="w-4 h-4 text-purple-600" />
                  }
                </button>
                {expandedFAQ === index && (
                  <div className="px-4 pb-4 text-purple-800 dark:text-purple-200">
                    <p className="whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Табы подкатегорий (как на donatov.net) */}
      {game.subcategories && game.subcategories.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {/* Описание подкатегорий */}
          {game.subcategory_description && (
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {game.subcategory_description}
                </p>
              </div>
            </div>
          )}

          {/* Табы подкатегорий */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            {game.subcategories.filter(sub => sub.enabled).map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => setActiveSubcategory(subcategory.id)}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeSubcategory === subcategory.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {subcategory.name}
              </button>
            ))}
          </div>

          {/* Товары активной подкатегории */}
          <div className="p-6">
            {filteredProducts.length > 0 ? (
              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold mb-2">Товары скоро появятся</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  В этой категории пока нет доступных товаров
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Если нет подкатегорий, показываем все товары */}
      {(!game.subcategories || game.subcategories.length === 0) && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-semibold mb-6">Доступные товары</h2>
          {game.products.length > 0 ? (
            <ProductGrid
              products={game.products}
              onAddToCart={handleAddToCart}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold mb-2">Товары скоро появятся</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Для этой игры пока нет доступных товаров
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}