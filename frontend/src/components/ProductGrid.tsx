// frontend/src/components/ProductGrid.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState } from 'react'
import { ShoppingCart, X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

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
}

interface CartItem {
  product: Product
  userData: Record<string, any>
  quantity: number
}

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product, userData: Record<string, any>) => void
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showUserDataModal, setShowUserDataModal] = useState<Product | null>(null)
  const [userData, setUserData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (product.input_fields && product.input_fields.length > 0) {
      // Если есть поля для заполнения, показываем модалку
      setShowUserDataModal(product)
      setUserData({})
      setErrors({})
    } else {
      // Если полей нет, сразу добавляем в корзину
      addToCart(product, {})
    }
  }

  const addToCart = (product: Product, formData: Record<string, any>) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id)

    if (existingIndex >= 0) {
      // Обновляем количество
      const newCartItems = [...cartItems]
      newCartItems[existingIndex].quantity += 1
      setCartItems(newCartItems)
    } else {
      // Добавляем новый товар
      setCartItems([...cartItems, {
        product,
        userData: formData,
        quantity: 1
      }])
    }

    onAddToCart(product, formData)
    setShowUserDataModal(null)
  }

  const validateForm = (product: Product, data: Record<string, any>) => {
    const newErrors: Record<string, string> = {}

    product.input_fields?.forEach(field => {
      if (field.required && (!data[field.name] || data[field.name].trim() === '')) {
        newErrors[field.name] = `${field.label} обязательно для заполнения`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitUserData = () => {
    if (!showUserDataModal) return

    if (validateForm(showUserDataModal, userData)) {
      addToCart(showUserDataModal, userData)
    }
  }

  const removeFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId))
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
      default:
        return (
          <input
            type={field.type}
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
      {/* Сетка товаров (2 столбца) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-zinc-800 rounded-lg overflow-hidden hover:bg-zinc-750 transition-colors">
            {/* 🆕 КАРТИНКА ТОВАРА */}
            {product.image_url && (
              <div className="relative h-48 bg-zinc-700">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Скрываем картинку если она не загрузилась
                    e.currentTarget.style.display = 'none'
                  }}
                />
                {/* Подкатегория поверх картинки */}
                {product.subcategory && (
                  <div className="absolute top-2 left-2 bg-black/70 text-blue-400 text-xs px-2 py-1 rounded font-medium">
                    {product.subcategory}
                  </div>
                )}
              </div>
            )}

            <div className="p-6">
              {/* Подкатегория (если нет картинки) */}
              {product.subcategory && !product.image_url && (
                <div className="text-xs text-blue-400 mb-2 font-medium">
                  {product.subcategory}
                </div>
              )}

              {/* Название товара */}
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>

              {/* Описание */}
              {product.description && (
                <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{product.description}</p>
              )}

              {/* Особая пометка */}
              {product.special_note && (
                <div className={`flex items-center gap-2 p-3 rounded border text-xs mb-3 ${getNoteColor(product.note_type)}`}>
                  {getNoteIcon(product.note_type)}
                  <span>{product.special_note}</span>
                </div>
              )}

              {/* Цена */}
              <div className="flex items-center gap-2 mb-4">
                {product.old_price_rub && (
                  <span className="text-zinc-500 line-through text-sm">
                    ₽{product.old_price_rub}
                  </span>
                )}
                <span className="text-xl font-bold text-green-400">
                  ₽{product.price_rub}
                </span>
              </div>

              {/* Кнопка добавления */}
              <button
                onClick={() => handleProductClick(product)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Добавить в корзину
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Корзина (появляется снизу при добавлении товаров) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-zinc-800 rounded-lg p-4 max-w-md w-full mx-4 border border-zinc-700 shadow-lg z-50">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Корзина ({cartItems.length})
          </h4>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center bg-zinc-700 rounded p-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.product.name}</div>
                  <div className="text-xs text-zinc-400">₽{item.product.price_rub} × {item.quantity}</div>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-red-400 hover:text-red-300 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-600">
            <div className="flex justify-between items-center font-semibold">
              <span>Итого:</span>
              <span>₽{cartItems.reduce((sum, item) => sum + (item.product.price_rub * item.quantity), 0)}</span>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded mt-2 transition-colors">
              Оформить заказ
            </button>
          </div>
        </div>
      )}

      {/* Модалка для ввода данных пользователя */}
      {showUserDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Данные для заказа</h3>
              <button
                onClick={() => setShowUserDataModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-zinc-700 rounded">
              <div className="font-medium">{showUserDataModal.name}</div>
              <div className="text-green-400 font-bold">₽{showUserDataModal.price_rub}</div>
            </div>

            <div className="space-y-4">
              {showUserDataModal.input_fields?.map((field) => (
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
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitUserData}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
              >
                Добавить в корзину
              </button>
              <button
                onClick={() => setShowUserDataModal(null)}
                className="px-4 bg-zinc-600 hover:bg-zinc-700 text-white py-2 rounded transition-colors"
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