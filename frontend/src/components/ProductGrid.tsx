// frontend/src/components/ProductGrid.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState } from 'react'
import { ShoppingCart, X, AlertTriangle, Info, CheckCircle, XCircle, Minus, Plus } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getImageUrl } from '@/lib/imageUtils'

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

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product, userData: Record<string, any>) => void
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [showUserDataModal, setShowUserDataModal] = useState<Product | null>(null)
  const [userData, setUserData] = useState<Record<string, any>>({})
  const [quantity, setQuantity] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addItems } = useCart()
  const router = useRouter()

  const getNoteIcon = (noteType: string) => {
    switch (noteType) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'info': return <Info className="w-4 h-4" />
      case 'success': return <CheckCircle className="w-4 h-4" />
      case 'error': return <XCircle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getNoteColor = (noteType: string) => {
    switch (noteType) {
      case 'warning': return 'bg-yellow-900/30 border-yellow-600 text-yellow-300'
      case 'info': return 'bg-blue-900/30 border-blue-600 text-blue-300'
      case 'success': return 'bg-green-900/30 border-green-600 text-green-300'
      case 'error': return 'bg-red-900/30 border-red-600 text-red-300'
      default: return 'bg-yellow-900/30 border-yellow-600 text-yellow-300'
    }
  }

  const handleProductClick = (product: Product) => {
    // Если у товара есть настраиваемые поля ввода, показываем модалку
    if (product.input_fields && product.input_fields.length > 0) {
      setShowUserDataModal(product)
      setUserData({})
      setQuantity(product.min_amount || 1)
      setErrors({})
    } else {
      // Если нет полей ввода, сразу добавляем в корзину
      handleQuickAddToCart(product)
    }
  }

  const handleQuickAddToCart = (product: Product) => {
    // Создаем элемент корзины без дополнительных полей
    const cartItem = {
      product: {
        id: product.id,
        game_id: product.game_id,
        name: product.name,
        price_rub: product.price_rub
      },
      inputs: {}
    }

    // Добавляем в корзину
    addItems([cartItem])

    // Показываем тоаст с кнопкой перехода в корзину
    toast.success(`${product.name} добавлен в корзину!`, {
      description: `Цена: ₽${product.price_rub}`,
      action: {
        label: 'В корзину',
        onClick: () => router.push('/order/cart'),
      },
      duration: 3000,
    })

    // Вызываем колбэк
    onAddToCart(product, {})
  }

  const validateForm = (product: Product, data: Record<string, any>) => {
    const newErrors: Record<string, string> = {}

    // Проверяем количество
    if (quantity < product.min_amount) {
      newErrors.quantity = `Минимальное количество: ${product.min_amount}`
    }
    if (quantity > product.max_amount) {
      newErrors.quantity = `Максимальное количество: ${product.max_amount}`
    }

    // Проверяем обязательные поля
    if (product.input_fields && product.input_fields.length > 0) {
      product.input_fields.forEach(field => {
        const value = data[field.name]

        if (field.required && (!value || value.toString().trim() === '')) {
          newErrors[field.name] = `${field.label} обязательно для заполнения`
        }

        // Дополнительная валидация для email
        if (field.type === 'email' && value && !value.includes('@')) {
          newErrors[field.name] = 'Введите корректный email'
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitUserData = () => {
    if (!showUserDataModal) return

    if (validateForm(showUserDataModal, userData)) {
      // Создаем элементы корзины для каждого количества
      const cartItems = Array.from({ length: quantity }, () => ({
        product: {
          id: showUserDataModal.id,
          game_id: showUserDataModal.game_id,
          name: showUserDataModal.name,
          price_rub: showUserDataModal.price_rub
        },
        inputs: userData
      }))

      // Добавляем в корзину
      addItems(cartItems)

      // Показываем тоаст с кнопкой
      toast.success(`${showUserDataModal.name} добавлен в корзину!`, {
        description: `Количество: ${quantity} × ₽${showUserDataModal.price_rub} = ₽${(quantity * showUserDataModal.price_rub).toFixed(2)}`,
        action: {
          label: 'В корзину',
          onClick: () => router.push('/order/cart'),
        },
        duration: 3000,
      })

      // Вызываем колбэк
      onAddToCart(showUserDataModal, userData)

      // Закрываем модалку
      setShowUserDataModal(null)
    }
  }

  const renderInputField = (field: InputField) => {
    const value = userData[field.name] || ''
    const error = errors[field.name]

    const baseInputClass = `w-full p-3 bg-zinc-700 text-white rounded border ${
      error ? 'border-red-500' : 'border-zinc-600'
    } focus:ring-2 focus:ring-blue-500`

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <select
              className={baseInputClass}
              value={value}
              onChange={e => setUserData(prev => ({ ...prev, [field.name]: e.target.value }))}
            >
              <option value="">Выберите...</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {field.help_text && (
              <p className="text-xs text-zinc-400 mt-1">{field.help_text}</p>
            )}
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <textarea
              className={baseInputClass}
              placeholder={field.placeholder}
              value={value}
              onChange={e => setUserData(prev => ({ ...prev, [field.name]: e.target.value }))}
              rows={3}
            />
            {field.help_text && (
              <p className="text-xs text-zinc-400 mt-1">{field.help_text}</p>
            )}
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              type={field.type}
              className={baseInputClass}
              placeholder={field.placeholder}
              value={value}
              onChange={e => setUserData(prev => ({ ...prev, [field.name]: e.target.value }))}
            />
            {field.help_text && (
              <p className="text-xs text-zinc-400 mt-1">{field.help_text}</p>
            )}
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
        )
    }
  }

  // Группируем товары по подкатегориям (используем новые поля)
  const groupedProducts = products.reduce((acc, product) => {
    // Используем subcategory_name, если есть, иначе fallback на subcategory, иначе "Общие товары"
    const category = product.subcategory_name || product.subcategory || 'Общие товары'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        <div key={category} className="space-y-4">
          {/* Заголовок подкатегории */}
          <div className="border-b border-zinc-200 dark:border-zinc-700 pb-2">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {category}
            </h3>
          </div>

          {/* Сетка товаров (2 столбца) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryProducts.map((product) => (
              <div key={product.id} className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="flex gap-4">
                    {/* Картинка товара */}
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={getImageUrl(product.image_url) || ''}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🎮
                        </div>
                      )}
                    </div>

                    {/* Информация о товаре */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                        {product.name}
                      </h4>

                      {product.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* Особая пометка */}
                      {product.special_note && (
                        <div className={`flex items-center gap-2 p-2 rounded border text-xs mb-2 ${getNoteColor(product.note_type)}`}>
                          {getNoteIcon(product.note_type)}
                          <span>{product.special_note}</span>
                        </div>
                      )}

                      {/* Цена и кнопка */}
                      <div className="flex items-center justify-between">
                        <div>
                          {product.old_price_rub && (
                            <div className="text-sm text-zinc-500 line-through">
                              ₽{product.old_price_rub}
                            </div>
                          )}
                          <div className="text-lg font-bold text-green-600">
                            ₽{product.price_rub}
                          </div>
                        </div>

                        <button
                          onClick={() => handleProductClick(product)}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center gap-2 transition-colors text-sm font-medium"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Купить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Модалка для ввода данных пользователя (только если есть поля ввода) */}
      {showUserDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Оформление покупки</h3>
              <button
                onClick={() => setShowUserDataModal(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Информация о товаре */}
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-700 rounded">
              <div className="font-medium">{showUserDataModal.name}</div>
              <div className="text-green-600 font-bold">₽{showUserDataModal.price_rub}</div>
              {showUserDataModal.description && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {showUserDataModal.description}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Количество */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Количество
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(showUserDataModal.min_amount, quantity - 1))}
                    className="p-2 bg-zinc-200 dark:bg-zinc-600 rounded"
                    disabled={quantity <= showUserDataModal.min_amount}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-medium px-4">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(showUserDataModal.max_amount, quantity + 1))}
                    className="p-2 bg-zinc-200 dark:bg-zinc-600 rounded"
                    disabled={quantity >= showUserDataModal.max_amount}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  От {showUserDataModal.min_amount} до {showUserDataModal.max_amount}
                </div>
                {errors.quantity && (
                  <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>
                )}
              </div>

              {/* Поля ввода */}
              {showUserDataModal.input_fields?.map(field => renderInputField(field))}

              {/* Итоговая цена */}
              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Итого:</span>
                  <span className="text-green-600">
                    ₽{(quantity * showUserDataModal.price_rub).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Кнопка оформления */}
              <button
                onClick={handleSubmitUserData}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Добавить в корзину
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}