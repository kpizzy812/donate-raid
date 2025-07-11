// frontend/src/app/game/[id]/page.tsx - КОМПАКТНАЯ ВЕРСИЯ КАК НА DONATOV.NET
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'
import { getImageUrl } from '@/lib/imageUtils'

import { ChevronDown, ChevronUp, HelpCircle, FileText, AlertCircle, AlertTriangle, Info, ShoppingCart, CheckCircle } from 'lucide-react'

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

interface InputField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea'
  required: boolean
  placeholder?: string
  help_text?: string
  options?: string[]
  validation_regex?: string
  min_length?: number
  max_length?: number
  subcategory_id?: number
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
  products: Product[]
  subcategories: GameSubcategory[]
  input_fields?: InputField[]
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
  const [inputValues, setInputValues] = useState<Record<string, string>>({})

  useEffect(() => {
    loadGame()
  }, [id])

  // ЗАМЕНИТЬ ЭТОТ useEffect:
useEffect(() => {
  console.log('🔄 Переключение подкатегории:', activeSubcategory)

  if (game?.input_fields) {
    const relevantFields = game.input_fields.filter(field =>
      !field.subcategory_id || field.subcategory_id === activeSubcategory
    )

    console.log('📋 Актуальные поля для подкатегории:', relevantFields)

    // Создаем новый объект значений только с полями текущей подкатегории
    const newInputValues: Record<string, string> = {}
    relevantFields.forEach(field => {
      // Сохраняем старое значение, если оно есть
      newInputValues[field.name] = inputValues[field.name] || ''
    })

    console.log('💾 Обновляем значения полей:', newInputValues)
    setInputValues(newInputValues)
  }
}, [activeSubcategory, game?.input_fields]) // Убираем inputValues из зависимостей!

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

    // ДОБАВИТЬ ЭТУ ОТЛАДКУ:
    console.log('🎮 Загруженная игра:', gameData)
    console.log('📝 Поля ввода:', gameData.input_fields)

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

  let filteredProducts = game.products

  // Фильтруем по подкатегории
  if (activeSubcategory !== null) {
    filteredProducts = filteredProducts.filter(product => product.subcategory_id === activeSubcategory)
  }

  // ДОБАВЛЕНО: Сортируем по sort_order
  return filteredProducts.sort((a, b) => a.sort_order - b.sort_order)
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

  // Функция для обновления значений полей ввода
  const handleInputChange = useCallback((fieldName: string, value: string) => {
  setInputValues(prev => ({
    ...prev,
    [fieldName]: value
  }))
}, [])

  // Покупка выбранных товаров
const handleBuySelected = () => {
  if (selectedProducts.size === 0) return

  const filteredProducts = getFilteredProducts()

  const relevantFields = game?.input_fields?.filter(field =>
  !field.subcategory_id || field.subcategory_id === activeSubcategory
) || []


  // Проверяем заполненность обязательных полей
  const missingFields = relevantFields.filter(field =>
    field.required && (!inputValues[field.name] || inputValues[field.name].trim() === '')
  )

  if (missingFields.length > 0) {
    alert(`Для выбранных товаров нужно заполнить поля: ${missingFields.map(f => f.label).join(', ')}`)
    return
  }

  // Собираем введенные данные для соответствующих полей
  const collectedInputs: Record<string, string> = {}
  relevantFields.forEach(field => {
    if (inputValues[field.name]) {
      collectedInputs[field.name] = inputValues[field.name]
    }
  })

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
        inputs: collectedInputs // Теперь здесь реальные данные!
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

  // Проверка валидности кнопки покупки
  const isSubmitDisabled = () => {
    if (selectedProducts.size === 0) return true

    const relevantFields = game?.input_fields?.filter(field =>
      !field.subcategory_id || field.subcategory_id === activeSubcategory
    ) || []

    const missingRequiredFields = relevantFields.filter(field =>
      field.required && (!inputValues[field.name] || inputValues[field.name].trim() === '')
    )

    return missingRequiredFields.length > 0
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
      case 'warning': return <AlertTriangle className="w-3 h-3 text-yellow-500" />
      case 'info': return <Info className="w-3 h-3 text-blue-500" />
      case 'success': return <CheckCircle className="w-3 h-3 text-green-500" />
      default: return <AlertTriangle className="w-3 h-3 text-yellow-500" />
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

  const logoImageUrl = getImageUrl(game.logo_url)
  const faqList = getFAQList()
  const filteredProducts = getFilteredProducts()
  const totalPrice = getTotalPrice()

  return (
    <div className="py-6 space-y-6 max-w-4xl mx-auto px-4">
      {/* Шапка игры */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-start gap-6">
          {/* Квадратная картинка игры */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={game.name}
                className="w-full h-full object-cover"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl">🎮</span>
              </div>
            )}
          </div>

          {/* Информация об игре */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl md:text-2xl font-bold">{game.name}</h1>
              {game.auto_support && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-1 rounded-full">
                  ✅ Автодоставка
                </span>
              )}
            </div>

            {game.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                {game.description}
              </p>
            )}

            {/* Кнопки для инструкций и FAQ */}
            <div className="flex gap-2 flex-wrap">
              {game.instructions && (
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  Инструкции
                </button>
              )}

              {faqList.length > 0 && (
                <button
                  onClick={() => setShowFAQ(!showFAQ)}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                  FAQ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Инструкции (раскрывающиеся) */}
      {showInstructions && game.instructions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Инструкции</h3>
          <p className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">{game.instructions}</p>
        </div>
      )}

      {/* FAQ (раскрывающиеся) */}
      {showFAQ && faqList.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <h3 className="font-semibold mb-3 text-purple-900 dark:text-purple-100">Часто задаваемые вопросы</h3>
          <div className="space-y-2">
            {faqList.map((faq, index) => (
              <div key={index} className="border border-purple-200 dark:border-purple-700 rounded-lg">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full text-left p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-purple-900 dark:text-purple-100">{faq.question}</span>
                  {expandedFAQ === index ?
                    <ChevronUp className="w-4 h-4 text-purple-600" /> :
                    <ChevronDown className="w-4 h-4 text-purple-600" />
                  }
                </button>
                {expandedFAQ === index && (
                  <div className="px-3 pb-3 text-sm text-purple-800 dark:text-purple-200">
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

      {/* ДОБАВИТЬ ЭТОТ БЛОК: Поля для ввода */}
      {(() => {
        const relevantFields = game?.input_fields?.filter(field =>
          !field.subcategory_id || field.subcategory_id === activeSubcategory
        ) || []

        if (relevantFields.length === 0) return null

        return (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Данные для заказа</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Заполните поля ниже для оформления заказа
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantFields.map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'select' ? (
  <select
    className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
    value={inputValues[field.name] || ''}
    onChange={(e) => handleInputChange(field.name, e.target.value)}
    required={field.required}
  >
    <option value="">Выберите...</option>
    {field.options?.map((option, i) => (
      <option key={i} value={option}>{option}</option>
    ))}
  </select>
) : field.type === 'textarea' ? (
  <textarea
    className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
    rows={3}
    placeholder={field.placeholder}
    value={inputValues[field.name] || ''}
    onChange={(e) => handleInputChange(field.name, e.target.value)}
    required={field.required}
  />
) : (
  <input
    type={field.type}
    className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
    placeholder={field.placeholder}
    value={inputValues[field.name] || ''}
    onChange={(e) => handleInputChange(field.name, e.target.value)}
    required={field.required}
  />
)}

                  {field.help_text && (
                    <p className="text-xs text-zinc-500 mt-1">{field.help_text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Фиксированная кнопка покупки внизу */}
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBuySelected}
              disabled={isSubmitDisabled()}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                isSubmitDisabled()
                  ? 'bg-zinc-400 dark:bg-zinc-600 text-zinc-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {isSubmitDisabled() ? 'Заполните обязательные поля' : `Купить за ${totalPrice} ₽`}
            </button>
            <p className="text-center text-xs text-zinc-500 mt-2">
              Выбрано товаров: {selectedProducts.size}
            </p>
          </div>
        </div>
      )}

      {/* Отступ для фиксированной кнопки */}
      {selectedProducts.size > 0 && <div className="h-20"></div>}
    </div>
  )
}