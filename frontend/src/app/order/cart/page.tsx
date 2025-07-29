// frontend/src/app/order/cart/page.tsx - ПОЛНАЯ ВЕРСИЯ
'use client'

import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'

export default function CartPage() {
  const { items, clearCart, removeItem } = useCart()
  const router = useRouter()

  const total = items.reduce((sum, item) => sum + (Number(item.product.price_rub) * (item.quantity || 1)), 0)

  // Функция для получения понятного названия поля
  const getFieldLabel = (fieldName: string): string => {
    const fieldLabels: Record<string, string> = {
      'player_id': 'Player ID',
      'server_id': 'Server ID',
      'user_id': 'User ID',
      'email': 'Email',
      'nickname': 'Никнейм',
      'region': 'Регион',
      'account_id': 'ID аккаунта',
      'character_name': 'Имя персонажа',
      'guild_name': 'Название гильдии',
      'phone': 'Телефон',
      'comment': 'Комментарий'
    }

    return fieldLabels[fieldName] || fieldName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const handleProceedToCheckout = () => {
    if (items.length === 0) return
    router.push('/order/checkout')
  }

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ShoppingCart className="w-8 h-8" />
          Корзина ({items.length})
        </h1>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm underline"
          >
            Очистить корзину
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="mx-auto w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ваша корзина пуста</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            Добавьте товары из каталога для оформления заказа
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список товаров */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
              >
                <div className="flex items-start gap-4">
  <div className="flex-1">
    <div className="flex items-start justify-between mb-2">
      <h3 className="font-semibold text-lg">{item.product.name}</h3>
      {(item.quantity && item.quantity > 1) && (
        <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-full">
          ×{item.quantity}
        </span>
      )}
    </div>

    <div className="text-2xl font-bold text-green-600 mb-4">
      {(item.quantity && item.quantity > 1) ? (
        <div className="flex items-center gap-2">
          <span>₽{item.product.price_rub}</span>
          <span className="text-sm text-zinc-500">× {item.quantity}</span>
          <span className="text-xl text-green-700">= ₽{item.product.price_rub * item.quantity}</span>
        </div>
      ) : (
        <span>₽{item.product.price_rub}</span>
      )}
    </div>

                    {/* Пользовательские данные */}
                    {Object.keys(item.inputs).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-zinc-500 uppercase">
                          Данные для заказа:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(item.inputs).map(([key, value]) => (
                            <div key={key} className="bg-zinc-50 dark:bg-zinc-800 px-3 py-2 rounded-lg">
                              <div className="text-xs text-zinc-500 mb-1">
                                {getFieldLabel(key)}:
                              </div>
                              <div className="font-medium text-sm">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeItem(i)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Удалить товар"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Боковая панель - итоги и оформление */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Итого</h3>

              {/* Детализация по товарам */}
              <div className="space-y-3 mb-6">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400 flex-1 mr-2">
                      {item.product.name}
                    </span>
                    <span className="font-medium whitespace-nowrap">
  {(item.quantity && item.quantity > 1) ?
    `₽${item.product.price_rub} × ${item.quantity} = ₽${item.product.price_rub * item.quantity}` :
    `₽${item.product.price_rub}`
  }
</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">К оплате:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₽{total}
                  </span>
                </div>
                <div className="text-sm text-zinc-500 mt-1">
                  {items.length} {items.length === 1 ? 'товар' :
                    items.length < 5 ? 'товара' : 'товаров'}
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Оформить заказ
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}