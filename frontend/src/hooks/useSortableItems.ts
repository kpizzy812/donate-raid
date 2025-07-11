// 1. Хук для получения данных о существующих играх/товарах
// frontend/src/hooks/useSortableItems.ts

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface SortableItem {
  id: number
  name: string
  sort_order: number
}

export function useGamesForSorting() {
  const [games, setGames] = useState<SortableItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await api.get('/admin/games')
        const gamesList = response.data.map((game: any) => ({
          id: game.id,
          name: game.name,
          sort_order: game.sort_order
        }))
        setGames(gamesList)
      } catch (error) {
        console.error('Ошибка загрузки игр для сортировки:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  return { games, loading }
}

export function useProductsForSorting(gameId?: number) {
  const [products, setProducts] = useState<SortableItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) {
      setProducts([])
      setLoading(false)
      return
    }

    const fetchProducts = async () => {
      try {
        const response = await api.get(`/admin/products?game_id=${gameId}`)
        const productsList = response.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          sort_order: product.sort_order
        }))
        setProducts(productsList)
      } catch (error) {
        console.error('Ошибка загрузки товаров для сортировки:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [gameId])

  return { products, loading }
}

// 2. Утилита для автоматического выбора следующей позиции
export function getNextSortOrder(items: SortableItem[]): number {
  if (items.length === 0) return 1

  const maxOrder = Math.max(...items.map(item => item.sort_order))
  return maxOrder + 1
}