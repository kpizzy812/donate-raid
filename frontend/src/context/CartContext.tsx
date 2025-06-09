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
}

type CartContextType = {
  items: CartItem[]
  addItems: (items: CartItem[]) => void
  clearCart: () => void
  removeItem: (index: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // 💾 Поддержка localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cart')
    if (stored) setItems(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItems = (newItems: CartItem[]) => {
    setItems((prev) => [...prev, ...newItems])
  }

  const clearCart = () => {
    setItems([])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <CartContext.Provider value={{ items, addItems, clearCart, removeItem }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
