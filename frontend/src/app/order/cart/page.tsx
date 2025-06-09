'use client'

import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'

export default function CartPage() {
  const { items, clearCart, removeItem } = useCart()
  const router = useRouter()
  const [method, setMethod] = useState<'card' | 'sbp' | null>(null)

  const total = items.reduce((sum, item) => sum + Number(item.product.price_rub), 0)

  const handleSubmit = async () => {
    if (!method) return alert('Выберите способ оплаты')
    if (items.length === 0) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            game_id: item.product.game_id,
            product_id: item.product.id,
            amount: item.product.price_rub,
            currency: 'RUB',
            payment_method: 'auto',
            comment: JSON.stringify(item.inputs),
          })),
        }),
      })

      if (!res.ok) throw new Error('Ошибка при создании заказа')

      const data = await res.json()
      const orderId = Array.isArray(data) ? data[0]?.id : data.id
      router.push(`/order/${orderId}`)
      setTimeout(() => clearCart(), 500)
    } catch (err) {
      alert('Ошибка при создании заказа')
      console.error(err)
    }
  }

  return (
    <div className="py-8 max-w-3xl mx-auto space-y-6 px-4">
      <h1 className="text-2xl font-bold">Корзина</h1>

      {items.length === 0 ? (
        <div className="text-center text-zinc-500 space-y-2 py-10">
          <ShoppingCart className="mx-auto w-10 h-10 text-zinc-400" />
          <p>Ваша корзина пуста.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div
                key={i}
                className="border rounded-xl p-4 space-y-2 relative dark:border-zinc-700"
              >
                <div className="font-semibold">{item.product.name}</div>
                <div className="text-sm text-zinc-500">{item.product.price_rub} ₽</div>
                {Object.entries(item.inputs).map(([k, v]) => (
                  <div key={k} className="text-sm">
                    <span className="text-zinc-500">{k}:</span> {v}
                  </div>
                ))}
                <button
                  onClick={() => removeItem(i)}
                  className="absolute top-2 right-2 text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-lg">💳 Способ оплаты:</div>
            <div className="flex gap-4">
              <button
                onClick={() => setMethod('card')}
                className={`px-4 py-2 rounded-md border ${
                  method === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              >
                Карта
              </button>
              <button
                onClick={() => setMethod('sbp')}
                className={`px-4 py-2 rounded-md border ${
                  method === 'sbp'
                    ? 'bg-blue-600 text-white'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              >
                СБП
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-lg"
          >
            Создать покупку на {total.toFixed(2)} ₽
          </button>
        </>
      )}
    </div>
  )
}
