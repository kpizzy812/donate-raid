'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchOrderById } from '@/lib/api'
import Link from 'next/link'

const statusSteps = [
  { key: 'pending', label: 'Ожидание оплаты', note: 'Оплатите покупку, чтобы продолжить.' },
  { key: 'paid', label: 'Передано в доставку', note: 'Заказы созданы и переданы в доставку.' },
  { key: 'processing', label: 'Доставляем', note: 'Заказ в очереди, ожидайте завершения.' },
  { key: 'done', label: 'Завершено', note: '' },
]

export default function OrderPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!id) return
    fetchOrderById(parseInt(id as string)).then(setOrder)
  }, [id])

  if (!order) return <div className="py-10 text-center">Загрузка...</div>

  const currentIndex = statusSteps.findIndex((s) => s.key === order.status)

  return (
    <div className="py-10 max-w-xl mx-auto space-y-6">
      <div className="text-sm text-zinc-500">/ Покупка #{order.id}</div>

      <div className="text-center">
        <h1 className="text-xl font-bold">Покупка</h1>
        <div className="text-3xl font-semibold mt-2">{order.amount} {order.currency}</div>
      </div>

      <div className="border-l-2 border-zinc-400 dark:border-zinc-600 ml-4 pl-6 relative">
        {statusSteps.map((step, index) => (
          <div key={step.key} className="mb-6 relative">
            <div
              className={`w-4 h-4 rounded-full absolute -left-[33px] top-1.5 border-2 ${
                index <= currentIndex ? 'bg-green-500 border-green-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
            <div className={`font-semibold ${
              index === currentIndex ? 'text-blue-600' : ''}`}>{step.label}</div>
            {step.note && <div className="text-sm text-zinc-500">{step.note}</div>}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-zinc-300 dark:border-zinc-700">
        <Link
          href={`/game/${order.game?.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {order.game?.name}
        </Link>

        <div className="mt-2 text-sm text-zinc-500">Товар: {order.product?.name}</div>
      </div>

      <div className="pt-4">
        <div className="text-sm text-zinc-600">ID заказа: <b>{order.id}</b></div>
        <div className="text-sm text-zinc-600">Дата: {new Date(order.created_at).toLocaleString()}</div>
      </div>

      {order.status === 'pending' && (
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md">
          Перейти к оплате
        </button>
      )}
    </div>
  )
}
