"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "В ожидании", color: "text-gray-500" },
  paid: { label: "Оплачен", color: "text-blue-500" },
  processing: { label: "В обработке", color: "text-yellow-500" },
  done: { label: "Завершён", color: "text-green-500" },
  canceled: { label: "Отменён", color: "text-red-500" },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [regular, manual] = await Promise.all([
          api.get("/orders/me"),
          api.get("/orders/manual/me"),
        ])
        const combined = [...regular.data, ...manual.data]
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setOrders(combined)
      } catch (err) {
        console.error("Ошибка загрузки заказов", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return (
    <div className="py-8 max-w-3xl mx-auto px-4 space-y-6">
      <h1 className="text-2xl font-bold">Мои заказы</h1>

      {loading ? (
        <p className="text-sm text-zinc-500">Загрузка...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500">У вас пока нет заказов.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusMap[order.status] || { label: order.status, color: "text-zinc-500" }
            return (
              <div
                key={order.id}
                className="border rounded-xl p-4 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow transition cursor-pointer"
                onClick={() => router.push(`/order/${order.id}`)}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold">
                    {order.product?.name || order.manual_game_name || "Без названия"}
                  </div>
                  <div className={`text-sm font-medium ${status.color}`}>{status.label}</div>
                </div>
                <div className="text-sm text-zinc-500">
                  {order.amount} {order.currency} • {new Date(order.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
