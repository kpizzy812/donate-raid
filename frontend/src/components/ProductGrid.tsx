// frontend/src/components/ProductGrid.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Info, ShoppingCart } from 'lucide-react'

interface InputField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea'
  required: boolean
  placeholder?: string
  help_text?: string
  options?: string[]
  subcategory_id?: number  // ДОБАВЛЕНО: поле для привязки к подкатегории
}

interface Product {
  id: number
  name: string
  price_rub: number
  old_price_rub?: number
  description?: string
  instructions?: string  // ДОБАВЛЕНО: поле инструкций
  type: 'currency' | 'item' | 'service'
  subcategory?: string
  subcategory_name?: string
  subcategory_id?: number  // ДОБАВЛЕНО: для сравнения с полями ввода
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
  gameInputFields?: InputField[]  // ДОБАВИТЬ ЭТО ПОЛЕ
}

// ИСПРАВЛЕНО: добавлен gameInputFields в деструктуризацию
export default function ProductGrid({ products, onAddToCart, gameInputFields }: ProductGridProps) {
  const { addItems } = useCart()
  const router = useRouter()

  const handleBuyNow = (product: Product) => {
    // ИСПРАВЛЕНО: добавлена безопасная проверка и правильное сравнение
    const relevantFields = gameInputFields?.filter(field =>
      !field.subcategory_id || field.subcategory_id === product.subcategory_id
    ) || []

    // Если есть обязательные поля, показываем их пользователю
    if (relevantFields.length > 0) {
      // Пока что просто уведомляем что есть поля для заполнения
      alert(`Для этого товара нужно заполнить поля: ${relevantFields.map(f => f.label).join(', ')}`)
    }

    // Создаем элемент корзины (пока с пустыми полями)
    const cartItem = {
      product: {
        id: product.id,
        game_id: product.game_id,
        name: product.name,
        price_rub: product.price_rub
      },
      inputs: {} // TODO: Здесь должны быть собранные поля
    }

    // Добавляем в корзину
    addItems([cartItem])

    // Вызываем колбэк
    onAddToCart(product, {})

    // Сразу переходим в корзину
    router.push('/order/cart')
  }

  const getImageUrl = (url?: string) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
    const baseUrl = apiUrl.replace('/api', '')
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const getNoteIcon = (noteType: string) => {
    switch (noteType) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getNoteStyle = (noteType: string) => {
    switch (noteType) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200'
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200'
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {products.map((product) => {
        const imageUrl = getImageUrl(product.image_url)

        return (
          <div
            key={product.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            {/* Картинка товара */}
            {imageUrl && (
              <div className="mb-4">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Название товара */}
            <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
              {product.name}
            </h3>

            {/* Подкатегория */}
            {(product.subcategory_name || product.subcategory) && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                {product.subcategory_name || product.subcategory}
              </div>
            )}

            {/* Описание товара */}
            {product.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Особая пометка */}
            {product.special_note && (
              <div className={`flex items-start gap-2 p-3 rounded-lg border mb-4 ${getNoteStyle(product.note_type)}`}>
                {getNoteIcon(product.note_type)}
                <span className="text-sm">
                  {product.special_note}
                </span>
              </div>
            )}

            {/* Цены */}
            <div className="flex items-center gap-3 mb-4">
              {/* Старая цена (зачеркнутая) */}
              {product.old_price_rub && (
                <span className="text-lg text-zinc-500 dark:text-zinc-400 line-through">
                  ₽{product.old_price_rub}
                </span>
              )}

              {/* Текущая цена */}
              <span className="text-2xl font-bold text-green-600">
                ₽{product.price_rub}
              </span>

              {/* Скидка */}
              {product.old_price_rub && product.old_price_rub > product.price_rub && (
                <span className="text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                  -{Math.round((1 - product.price_rub / product.old_price_rub) * 100)}%
                </span>
              )}
            </div>

            {/* Количество */}
            {(product.min_amount !== product.max_amount || product.min_amount !== 1) && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Количество: {product.min_amount === product.max_amount
                  ? product.min_amount
                  : `${product.min_amount} - ${product.max_amount}`
                }
              </div>
            )}

            {/* Кнопка покупки */}
            <button
              onClick={() => handleBuyNow(product)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Купить за ₽{product.price_rub}
            </button>

            {/* Инструкции к товару */}
            {product.instructions && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                  Инструкции
                </summary>
                <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                  <p className="whitespace-pre-wrap">{product.instructions}</p>
                </div>
              </details>
            )}

            {/* Тип товара */}
            <div className="mt-3 flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                {product.type === 'currency' && '💰 Валюта'}
                {product.type === 'item' && '📦 Предмет'}
                {product.type === 'service' && '🔧 Услуга'}
              </span>
              <span>ID: {product.id}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}