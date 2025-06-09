// frontend/src/app/admin/products/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Product {
  id: number
  game_id: number
  name: string
  price_rub: number
  type: 'currency' | 'item' | 'service'
  enabled: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const router = useRouter()

  useEffect(() => {
    api.get('/admin/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error('Ошибка загрузки товаров', err))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить товар?')) return
    try {
      await api.delete(`/admin/products/${id}`)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Ошибка удаления товара', err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Товары</h1>
        <Link href="/admin/products/create" className="bg-green-600 text-white px-4 py-2 rounded">
          + Новый товар
        </Link>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-700">
          <tr>
            <th className="py-2">ID</th>
            <th>Игра</th>
            <th>Название</th>
            <th>Цена (₽)</th>
            <th>Тип</th>
            <th>Активен</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} className="border-b border-zinc-800 hover:bg-zinc-800">
              <td className="py-2 pr-2">{product.id}</td>
              <td>{product.game_id}</td>
              <td>{product.name}</td>
              <td>{Number(product.price_rub).toFixed(2)}</td>
              <td>{product.type}</td>
              <td>{product.enabled ? 'Да' : 'Нет'}</td>
              <td className="text-right space-x-2">
                <Link href={`/admin/products/${product.id}/edit`} className="text-blue-500 hover:underline">
                  Редактировать
                </Link>
                <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:underline">
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
