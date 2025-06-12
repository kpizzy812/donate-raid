// frontend/src/components/ProductGrid.tsx - НОВЫЙ КОМПОНЕНТ
'use client'

import { useState } from 'react'
import { ShoppingCart, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

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
  special_note?: string
  note_type: string
  input_fields: InputField[]
  subcategory?: string
}

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product, userData: Record<string, any>) => void
}

interface CartItem {
  product: Product
  userData: Record<string, any>
  quantity: number
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
      case 'warning': return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30'
      case 'info': return 'bg-blue-600/20 text-blue-300 border-blue-600/30'
      case 'success': return 'bg-green-600/20 text-green-300 border-green-600/30'
      case 'error': return 'bg-red-600/20 text-red-300 border-red-600/30'
      default: return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30'
    }
  }

  const handleProductClick = (product: Product) => {
    if (product.input_fields && product.input_fields.length > 0) {
      setShowUserDataModal(product)
      setUserData({})
      setErrors({})
    } else {
      // Если нет дополнительных полей, сразу добавляем в корзину
      addToCart(product, {})
    }
  }

  const addToCart = (product: Product, formData: Record<string, any>) => {
    // Проверяем, есть ли уже этот товар в корзине
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

  return (
    <div className="space-y-6">
      {/* Сетка товаров (2 столбца) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-zinc-800 rounded-lg overflow-hidden hover:bg-zinc-750 transition-colors">
            <div className="p-6">
              {/* Подкатегория */}
              {product.subcategory && (
                <div className="text-xs text-blue-400 mb-2 font-medium">
                  {product.subcategory}
                </div>
              )}

              {/* Название товара */}
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>

              {/* Описание */}
              {product.description && (
                <p className="text-zinc-400 text-sm mb-3">{product.description}</p>
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
                  <div className="font-medium text-sm">{item.product.name}</div>
                  <div className="text-xs text-zinc-400">
                    ₽{item.product.price_rub} × {item.quantity}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-600">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Итого:</span>
              <span className="font-bold text-green-400">
                ₽{cartItems.reduce((sum, item) => sum + (item.product.price_rub * item.quantity), 0)}
              </span>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm transition-colors">
              Перейти к оплате
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно для ввода данных пользователя */}
      {showUserDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Заполните данные для "{showUserDataModal.name}"
            </h3>

            <form className="space-y-4">
              {showUserDataModal.input_fields?.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-400"> *</span>}
                  </label>

                  {field.type === 'select' && field.options ? (
                    <select
                      className="w-full p-2 bg-zinc-700 text-white rounded border border-zinc-600 focus:border-blue-500"
                      value={userData[field.name] || ''}
                      onChange={(e) => setUserData({...userData, [field.name]: e.target.value})}
                    >
                      <option value="">Выберите...</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      className="w-full p-2 bg-zinc-700 text-white rounded border border-zinc-600 focus:border-blue-500"
                      placeholder={field.placeholder}
                      rows={3}
                      value={userData[field.name] || ''}
                      onChange={(e) => setUserData({...userData, [field.name]: e.target.value})}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="w-full p-2 bg-zinc-700 text-white rounded border border-zinc-600 focus:border-blue-500"
                      placeholder={field.placeholder}
                      value={userData[field.name] || ''}
                      onChange={(e) => setUserData({...userData, [field.name]: e.target.value})}
                    />
                  )}

                  {field.help_text && (
                    <p className="text-xs text-zinc-400 mt-1">{field.help_text}</p>
                  )}

                  {errors[field.name] && (
                    <p className="text-xs text-red-400 mt-1">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </form>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserDataModal(null)}
                className="flex-1 bg-zinc-600 hover:bg-zinc-700 text-white py-2 rounded transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitUserData}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
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