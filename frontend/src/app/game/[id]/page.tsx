// frontend/src/app/game/[id]/page.tsx - ПОЛНАЯ ВЕРСИЯ С ДИНАМИЧЕСКИМИ ПОЛЯМИ
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, HelpCircle, FileText, AlertCircle, AlertTriangle, Info, ShoppingCart, CheckCircle } from 'lucide-react'

interface InputField {
  name: string
  label: string
  type: string
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
  subcategory_id?: number
  subcategory_name?: string
  special_note?: string
  note_type: string
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
  subcategory_description?: string
  input_fields?: InputField[]  // ДОБАВЛЕНО: динамические поля
  products: Product[]
  subcategories: GameSubcategory[]
}

interface FAQItem {
  question: string
  answer: string
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { addItems } = useCart()

  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())

  // НОВОЕ: Динамические поля ввода вместо статических playerId/serverId
  const [userInputs, setUserInputs] = useState<Record<string, string>>({})

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
    if (activeSubcategory === null) return game.products
    return game.products.filter(product => product.subcategory_id === activeSubcategory)
  }

  // Обработка выбора товара
  const handleProductSelect = (productId: number, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }

  // ИСПРАВЛЕННАЯ функция покупки выбранных товаров
  const handleBuySelected = () => {
    if (selectedProducts.size === 0) return

    const filteredProducts = getFilteredProducts()
    const cartItems = Array.from(selectedProducts)
      .map(productId => {
        const product = filteredProducts.find(p => p.id === productId)
        if (!product) return null

        return {
          product: {
            id: product.id,
            game_id: product.game_id,
            name: product.name,
            price_rub: product.price_rub
          },
          inputs: userInputs // ИСПРАВЛЕНО: передаем динамические поля
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    if (cartItems.length === 0) return

    addItems(cartItems)
    router.push('/order/cart')
  }

  // Подсчет общей суммы
  const getTotalPrice = () => {
    const filteredProducts = getFilteredProducts()
    return Array.from(selectedProducts).reduce((total, productId) => {
      const product = filteredProducts.find(p => p.id === productId)
      return total + (product?.price_rub || 0)
    }, 0)
  }

  const getImageUrl = (url?: string) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
    const baseUrl = apiUrl.replace('/api', '')
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const getNoteIcon = (noteType: string) => {
    switch (noteType) {
      case 'warning': return <AlertTriangle className="w-3 h-3" />
      case 'info': return <Info className="w-3 h-3" />
      case 'danger': return <AlertCircle className="w-3 h-3" />
      default: return <Info className="w-3 h-3" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Игра не найдена</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Возможно, игра была удалена или URL неверный</p>
        </div>
      </div>
    )
  }

  const filteredProducts = getFilteredProducts()
  const totalPrice = getTotalPrice()
  const faqList = getFAQList()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      {/* Заголовок игры */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-start gap-4">
            {/* Логотип игры */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
              {game.logo_url && getImageUrl(game.logo_url) ? (
              <img
                src={getImageUrl(game.logo_url)!}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg">💎</span>
                </div>
              )}
            </div>

            {/* Информация об игре */}
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{game.name}</h1>
              {game.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{game.description}</p>
              )}
            </div>
          </div>

          {/* Кнопки инструкций и FAQ */}
          <div className="flex gap-2 mt-4">
            {game.instructions && (
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                Инструкции
              </button>
            )}
            {faqList.length > 0 && (
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                FAQ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Инструкции */}
        {showInstructions && game.instructions && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Инструкции
            </h3>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
              {game.instructions}
            </div>
          </div>
        )}

        {/* FAQ */}
        {showFAQ && faqList.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Часто задаваемые вопросы
            </h3>
            <div className="space-y-2">
              {faqList.map((faq, index) => (
                <div key={index} className="border border-zinc-200 dark:border-zinc-700 rounded-lg">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{faq.question}</span>
                    {expandedFAQ === index ?
                      <ChevronUp className="w-4 h-4" /> :
                      <ChevronDown className="w-4 h-4" />
                    }
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-3 pb-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <p className="whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Основной контент с товарами */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {/* Описание подкатегорий */}
          {game.subcategory_description && (
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {game.subcategory_description}
                </p>
              </div>
            </div>
          )}

          {/* Табы подкатегорий */}
          {game.subcategories && game.subcategories.length > 0 && (
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              {game.subcategories.filter(sub => sub.enabled).map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => {
                    setActiveSubcategory(subcategory.id)
                    setSelectedProducts(new Set()) // Сбрасываем выбор при смене категории
                  }}
                  className={`px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 text-sm ${
                    activeSubcategory === subcategory.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
          )}

          {/* Товары */}
          <div className="p-4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const imageUrl = getImageUrl(product.image_url)
                  const isSelected = selectedProducts.has(product.id)

                  return (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-3 transition-all cursor-pointer hover:shadow-md ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                      onClick={() => handleProductSelect(product.id, !isSelected)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Чекбокс */}
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-zinc-300 dark:border-zinc-600'
                          }`}>
                            {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                        </div>

                        {/* Квадратная картинка товара */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center">
                              <span className="text-white text-xs">
                                {product.type === 'currency' && '💰'}
                                {product.type === 'item' && '📦'}
                                {product.type === 'service' && '🔧'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Информация о товаре */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>

                          {/* Цены */}
                          <div className="flex items-center gap-2 mb-1">
                            {product.old_price_rub && (
                              <span className="text-xs text-zinc-500 line-through">
                                ₽{product.old_price_rub}
                              </span>
                            )}
                            <span className="text-lg font-bold text-green-600">
                              ₽{product.price_rub}
                            </span>
                            {product.old_price_rub && product.old_price_rub > product.price_rub && (
                              <span className="text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">
                                -{Math.round((1 - product.price_rub / product.old_price_rub) * 100)}%
                              </span>
                            )}
                          </div>

                          {/* Особая пометка */}
                          {product.special_note && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              {getNoteIcon(product.note_type)}
                              <span className="line-clamp-1">{product.special_note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-semibold mb-2">Товары скоро появятся</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  В этой категории пока нет доступных товаров
                </p>
              </div>
            )}
          </div>
        </div>

        {/* НОВОЕ: Динамические поля для ввода данных */}
        {selectedProducts.size > 0 && game.input_fields && game.input_fields.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h3 className="font-semibold mb-3">Данные для покупки</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {game.input_fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={userInputs[field.name] || ''}
                      onChange={(e) => setUserInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-lg font-mono"
                      required={field.required}
                    >
                      <option value="">Выберите...</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={userInputs[field.name] || ''}
                      onChange={(e) => setUserInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-lg font-mono"
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={userInputs[field.name] || ''}
                      onChange={(e) => setUserInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-lg font-mono"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                  {field.help_text && (
                    <p className="text-xs text-zinc-500 mt-1">{field.help_text}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Где найти?</p>
              <div className="flex gap-4 text-xs text-zinc-500">
                <span>✓ Для всех регионов🏳️</span>
                <span>✓ Без передачи аккаунта🔒</span>
                <span>✓ Выгодно🏆</span>
                <span>✓ Круглосуточно⚪</span>
                <span>✓ Кешбек ⚡</span>
                <span>⚡ Моментальная доставка</span>
              </div>
            </div>

            {/* Чекбокс с условиями */}
            <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" />
                <span>
                  Я ознакомился с ограничениями по регионам и понимаю, что для российских
                  аккаунтов работает только регион "Россия". Я подтверждаю, что выбрал
                  нужный мне регион и что возврат возможен только на баланс сайта.
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Фиксированная кнопка покупки внизу */}
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBuySelected}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Купить за {totalPrice} ₽
            </button>
            <p className="text-center text-xs text-zinc-500 mt-2">
              Выбрано товаров: {selectedProducts.size}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}