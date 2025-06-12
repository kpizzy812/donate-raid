// frontend/src/app/game/[id]/page.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import ProductGrid from '@/components/ProductGrid'
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
}

interface Game {
  id: number
  name: string
  banner_url?: string
  description?: string
  instructions?: string
  auto_support: boolean
  products: Product[]
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGame()
  }, [id])

  const loadGame = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/games/${id}`)
      setGame(response.data)
    } catch (error) {
      console.error('Ошибка загрузки игры:', error)
      toast.error('Ошибка загрузки игры')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product, userData: Record<string, any>) => {
    // Здесь будет логика добавления в корзину
    console.log('Добавляем в корзину:', product, userData)
    
    toast.success(`${product.name} добавлен в корзину!`, {
      description: `Цена: ₽${product.price_rub}`,
      action: {
        label: 'Оформить заказ',
        onClick: () => router.push('/order/checkout'),
      },
    })
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

  return (
    <div className="py-6 space-y-6 max-w-6xl mx-auto px-4">
      {/* Баннер игры */}
      {game.banner_url && (
        <div className="rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-700">
          <img 
            src={game.banner_url} 
            alt={game.name} 
            className="w-full h-48 md:h-64 object-cover"
          />
        </div>
      )}

      {/* Название и описание */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-center md:text-left">{game.name}</h1>
        
        {game.description && (
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {game.description}
          </p>
        )}
      </div>

      {/* Продукты */}
      {game.auto_support ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Доступные товары</h2>
            <span className="text-sm text-zinc-500 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              ✅ Автоматическая доставка
            </span>
          </div>

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
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Создать ручной заказ
            </button>
          </div>

          {/* Инструкции */}
          {game.instructions && (
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Инструкции для заказа</h3>
              <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                {game.instructions}
              </p>
            </div>
          )}
        </div>
      )}

      {/* FAQ и дополнительная информация */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Информация о доставке</h3>
        <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-1">•</span>
            <span>Безопасная доставка через официальные методы игры</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-1">•</span>
            <span>Поддержка 24/7 в случае возникновения вопросов</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-1">•</span>
            <span>Гарантия возврата средств при невыполнении заказа</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-1">•</span>
            <span>Все транзакции защищены и конфиденциальны</span>
          </div>
        </div>
      </div>

      {/* Кнопка обратно */}
      <div className="text-center pt-6">
        <button
          onClick={() => router.push('/')}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          ← Вернуться к списку игр
        </button>
      </div>
    </div>
  )
}