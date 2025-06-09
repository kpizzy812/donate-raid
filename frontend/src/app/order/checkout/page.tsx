'use client'

import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const router = useRouter()
  const [method, setMethod] = useState<'card' | 'sbp' | null>(null)
  const total = items.reduce((sum, i) => sum + Number(i.product.price_rub), 0)

  useEffect(() => {
    if (items.length === 0) router.push('/')
  }, [items, router])

  const handleSubmit = async () => {
  if (!method) return alert('Выберите способ оплаты')

  const firstItem = items[0]
  if (!firstItem) return

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`, // ⚠️ проверь ключ
      },
      body: JSON.stringify({
        game_id: firstItem.product.game_id,
        product_id: firstItem.product.id,
        amount: firstItem.product.price_rub,
        currency: 'RUB',
        payment_method: method === 'card' ? 'manual' : 'manual', // пока оба manual
        comment: JSON.stringify(firstItem.inputs),
      }),
    })


    if (!res.ok) throw new Error('Ошибка при создании заказа')

    const data = await res.json()
    router.push(`/order/${data.id}`)
    setTimeout(() => clearCart(), 500)





  } catch (err) {
    alert('Ошибка при создании заказа')
    console.error(err)
  }
}


  return (
    <div className="py-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Оформление заказа</h1>

      {items.map((item, i) => (
        <div key={i} className="border rounded-xl p-4 space-y-2 dark:border-zinc-700">
          <div className="font-semibold">{item.product.name}</div>
          <div className="text-sm text-zinc-500">{item.product.price_rub} ₽</div>
          {Object.entries(item.inputs).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="text-zinc-500">{k}:</span> {v}
            </div>
          ))}
        </div>
      ))}

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
    </div>
  )
}
