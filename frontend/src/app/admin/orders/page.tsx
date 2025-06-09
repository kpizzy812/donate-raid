'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Order {
  id: number
  user_id: number
  product_id: number
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'processing' | 'done' | 'canceled'
  payment_method: 'auto' | 'manual'
  created_at: string
}

const statusLabels: Record<Order['status'], string> = {
  pending: 'Ожидает',
  paid: 'Оплачен',
  processing: 'В обработке',
  done: 'Завершён',
  canceled: 'Отменён',
}

const statusColors: Record<Order['status'], string> = {
  pending: 'text-gray-400',
  paid: 'text-blue-400',
  processing: 'text-yellow-400',
  done: 'text-green-400',
  canceled: 'text-red-400',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('')

  const fetchOrders = () => {
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`/admin/orders${params}`)
      .then(res => setOrders(res.data))
      .catch(err => console.error('Ошибка загрузки заказов', err))
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${id}`, { status: newStatus })
      fetchOrders()
    } catch (err) {
      console.error('Ошибка смены статуса', err)
    }
  }

  const handleRefund = async (id: number, amount: number) => {
    if (!confirm(`Вернуть ${amount} ₽ по заказу #${id}?`)) return
    try {
      await api.post(`/admin/orders/${id}/refund`, { refund_amount: amount })
      fetchOrders()
    } catch (err) {
      console.error('Ошибка возврата', err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Заказы</h1>

      <div className="mb-4">
        <label className="mr-2">Фильтр по статусу:</label>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-zinc-800 text-white p-2 rounded"
        >
          <option value="">Все</option>
          <option value="pending">Ожидает</option>
          <option value="paid">Оплачен</option>
          <option value="processing">В обработке</option>
          <option value="done">Завершён</option>
          <option value="canceled">Отменён</option>
        </select>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-700">
          <tr>
            <th className="py-2">ID</th>
            <th>Пользователь</th>
            <th>Товар</th>
            <th>Сумма</th>
            <th>Валюта</th>
            <th>Статус</th>
            <th>Оплата</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="border-b border-zinc-800 hover:bg-zinc-800">
              <td className="py-2 pr-2">{order.id}</td>
              <td>{order.user_id}</td>
              <td>{order.product_id}</td>
              <td>{order.amount.toFixed(2)}</td>
              <td>{order.currency}</td>
              <td className={statusColors[order.status]}>{statusLabels[order.status]}</td>
              <td>{order.payment_method}</td>
              <td>{new Date(order.created_at).toLocaleString()}</td>
              <td className="text-right space-x-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(order.id, 'done')}
                      className="text-green-500 hover:underline"
                    >
                      Завершить
                    </button>
                    <button
                      onClick={() => handleRefund(order.id, order.amount)}
                      className="text-red-500 hover:underline"
                    >
                      Возврат
                    </button>
                  </>
                )}
                {order.status === 'done' && (
                  <span className="text-green-400">✔</span>
                )}
                {order.status === 'canceled' && (
                  <span className="text-red-400">✘</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
