// frontend/src/context/CartContext.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type CartItem = {
  product: {
    id: number
    game_id: number
    name: string
    price_rub: number
  }
  inputs: Record<string, string>
  quantity?: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  addItems: (items: CartItem[]) => void
  clearCart: () => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  getTotalCount: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Предотвращаем гидратацию на сервере
  useEffect(() => {
    setMounted(true)
  }, [])

  // Загружаем корзину из localStorage при монтировании
  useEffect(() => {
    if (mounted) {
      const stored = localStorage.getItem('cart')
      if (stored) {
        try {
          const parsedItems = JSON.parse(stored)
          setItems(Array.isArray(parsedItems) ? parsedItems : [])
        } catch (error) {
          console.error('Ошибка загрузки корзины:', error)
          localStorage.removeItem('cart')
        }
      }
    }
  }, [mounted])

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items))
    }
  }, [items, mounted])

  const addItem = (newItem: CartItem) => {
    setItems(prev => {
      // Проверяем, есть ли уже такой товар с такими же параметрами
      const existingIndex = prev.findIndex(item => 
        item.product.id === newItem.product.id &&
        JSON.stringify(item.inputs) === JSON.stringify(newItem.inputs)
      )

      if (existingIndex >= 0) {
        // Увеличиваем количество существующего товара
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 1) + (newItem.quantity || 1)
        }
        return updated
      } else {
        // Добавляем новый товар
        return [...prev, { ...newItem, quantity: newItem.quantity || 1 }]
      }
    })
  }

  const addItems = (newItems: CartItem[]) => {
    setItems(prev => {
      let updated = [...prev]
      
      newItems.forEach(newItem => {
        const existingIndex = updated.findIndex(item => 
          item.product.id === newItem.product.id &&
          JSON.stringify(item.inputs) === JSON.stringify(newItem.inputs)
        )

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: (updated[existingIndex].quantity || 1) + (newItem.quantity || 1)
          }
        } else {
          updated.push({ ...newItem, quantity: newItem.quantity || 1 })
        }
      })
      
      return updated
    })
  }

  const clearCart = () => {
    setItems([])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index)
      return
    }

    setItems(prev => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index] = { ...updated[index], quantity }
      }
      return updated
    })
  }

  const getTotalCount = () => {
    return items.reduce((total, item) => total + (item.quantity || 1), 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.product.price_rub * (item.quantity || 1)), 0)
  }

  // Если компонент еще не смонтирован, возвращаем пустые значения
  if (!mounted) {
    return (
      <CartContext.Provider value={{
        items: [],
        addItem: () => {},
        addItems: () => {},
        clearCart: () => {},
        removeItem: () => {},
        updateQuantity: () => {},
        getTotalCount: () => 0,
        getTotalPrice: () => 0
      }}>
        {children}
      </CartContext.Provider>
    )
  }

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      addItems,
      clearCart,
      removeItem,
      updateQuantity,
      getTotalCount,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}