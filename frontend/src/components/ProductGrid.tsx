// frontend/src/components/ProductGrid.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState } from 'react'
import { ShoppingCart, X, AlertTriangle, Info, CheckCircle, XCircle, Minus, Plus } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
    setShowUserDataModal(product)
    setUserData({})
    setQuantity(product.min_amount || 1)
    setErrors({})
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

      // Показываем красивый тоаст с кнопкой
      toast.success(`${showUserDataModal.name} добавлен в корзину!`, {
        description: `Количество: ${quantity} × ₽${showUserDataModal.price_rub} = ₽${(quantity * showUserDataModal.price_rub).toFixed(2)}`,
        action: {
          label: 'Оформить заказ',
          onClick: () => router.push('/order/cart'),
        },
        duration: 5000,
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
    } focus:border-blue-500 focus:outline-none`

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className={baseInputClass}
            value={value}
            onChange={e => setUserData({ ...userData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            rows={3}
          />
        )
      case 'select':
        return (
          <select
            className={baseInputClass}
            value={value}
            onChange={e => setUserData({ ...userData, [field.name]: e.target.value })}
          >
            <option value="">Выберите...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'number':
        return (
          <input
            type="number"
            className={baseInputClass}
            value={value}
            onChange={e => setUserData({ ...userData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
          />
        )
      case 'email':
        return (
          <input
            type="email"
            className={baseInputClass}
            value={value}
            onChange={e => setUserData({ ...userData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
          />
        )
      case 'password':
        return (
          <input
            type="password"
            className={baseInputClass}
            value={value}
            onChange={e => setUserData({ ...userData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
          />
        )
      default:
        return (
          <input
            type="text"
            className={baseInputClass}
            value={value}
            onChange={e => setUserData({ ...userData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Единый бокс со всеми товарами */}
      <div className="bg-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Доступные товары</h2>

        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-zinc-700/50 rounded-lg p-4 hover:bg-zinc-700 transition-colors">
              <div className="flex gap-4">
                {/* Картинка товара */}
                {product.image_url && (
                  <div className="w-20 h-20 bg-zinc-600 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Информация о товаре */}
                <div className="flex-1 min-w-0">
                  {/* Подкатегория */}
                  {product.subcategory && (
                    <div className="text-xs text-blue-400 mb-1 font-medium">
                      {product.subcategory}
                    </div>
                  )}

                  {/* Название */}
                  <h3 className="font-semibold mb-1 text-white">{product.name}</h3>

                  {/* Описание */}
                  {product.description && (
                    <p className="text-zinc-400 text-sm mb-2 line-clamp-2">{product.description}</p>
                  )}

                  {/* Особая пометка */}
                  {product.special_note && (
                    <div className={`flex items-center gap-2 p-2 rounded border text-xs mb-2 ${getNoteColor(product.note_type)}`}>
                      {getNoteIcon(product.note_type)}
                      <span>{product.special_note}</span>
                    </div>
                  )}

                  {/* Диапазон количества */}
                  <div className="text-xs text-zinc-500 mb-2">
                    Количество: от {product.min_amount} до {product.max_amount}
                  </div>
                </div>

                {/* Цена и кнопка */}
                <div className="text-right flex-shrink-0">
                  <div className="mb-3">
                    {product.old_price_rub && (
                      <div className="text-zinc-500 line-through text-sm">
                        ₽{product.old_price_rub}
                      </div>
                    )}
                    <div className="text-xl font-bold text-green-400">
                      ₽{product.price_rub}
                    </div>
                  </div>

                  <button
                    onClick={() => handleProductClick(product)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center gap-2 transition-colors text-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Купить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Модалка для ввода данных пользователя */}
      {showUserDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Оформление покупки</h3>
              <button
                onClick={() => setShowUserDataModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Информация о товаре */}
            <div className="mb-6 p-4 bg-zinc-700 rounded">
              <div className="font-medium">{showUserDataModal.name}</div>
              <div className="text-green-400 font-bold">₽{showUserDataModal.price_rub}</div>
              {showUserDataModal.description && (
                <div className="text-sm text-zinc-400 mt-1">{showUserDataModal.description}</div>
              )}
            </div>

            <div className="space-y-4">
              {/* Количество */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Количество <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(showUserDataModal.min_amount, quantity - 1))}
                    disabled={quantity <= showUserDataModal.min_amount}
                    className="w-10 h-10 bg-zinc-600 hover:bg-zinc-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(showUserDataModal.min_amount, Math.min(showUserDataModal.max_amount, parseInt(e.target.value) || showUserDataModal.min_amount)))}
                    min={showUserDataModal.min_amount}
                    max={showUserDataModal.max_amount}
                    className="flex-1 text-center p-2 bg-zinc-700 text-white rounded border border-zinc-600 focus:border-blue-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(showUserDataModal.max_amount, quantity + 1))}
                    disabled={quantity >= showUserDataModal.max_amount}
                    className="w-10 h-10 bg-zinc-600 hover:bg-zinc-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-zinc-400 mt-1">
                  От {showUserDataModal.min_amount} до {showUserDataModal.max_amount}
                </div>

                {errors.quantity && (
                  <p className="text-xs text-red-400 mt-1">{errors.quantity}</p>
                )}
              </div>

              {/* ИСПРАВЛЕНО: Дополнительные поля от админа */}
              {showUserDataModal.input_fields && showUserDataModal.input_fields.length > 0 && (
                <>
                  <div className="border-t border-zinc-600 pt-4">
                    <h4 className="text-sm font-medium mb-3 text-zinc-300">
                      Дополнительная информация для заказа:
                    </h4>
                  </div>

                  {showUserDataModal.input_fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>

                      {renderInputField(field)}

                      {field.help_text && (
                        <p className="text-xs text-zinc-400 mt-1">{field.help_text}</p>
                      )}

                      {errors[field.name] && (
                        <p className="text-xs text-red-400 mt-1">{errors[field.name]}</p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Итоговая сумма */}
            <div className="mt-6 p-4 bg-zinc-700 rounded">
              <div className="flex justify-between items-center">
                <span>Итого:</span>
                <span className="text-xl font-bold text-green-400">
                  ₽{(showUserDataModal.price_rub * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitUserData}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded transition-colors font-medium"
              >
                Добавить в корзину
              </button>
              <button
                onClick={() => setShowUserDataModal(null)}
                className="px-6 bg-zinc-600 hover:bg-zinc-700 text-white py-3 rounded transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}