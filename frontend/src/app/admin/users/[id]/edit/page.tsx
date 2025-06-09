// frontend/src/app/admin/users/[id]/edit/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('user')
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/admin/users/${id}`)
      .then(res => {
        const u = res.data
        setEmail(u.email || '')
        setUsername(u.username || '')
        setRole(u.role)
        setBalance(Number(u.balance))
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdate = async () => {
    try {
      await api.put(`/admin/users/${id}`, {
        email,
        username,
        role,
        balance,
      })
      router.push('/admin/users')
    } catch (err) {
      console.error('Ошибка при обновлении пользователя', err)
    }
  }

  if (loading) return <div className="p-6 text-center">Загрузка...</div>

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Редактирование пользователя</h1>

      <input
        type="text"
        placeholder="Email"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="text"
        placeholder="Username"
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      <select
        value={role}
        onChange={e => setRole(e.target.value)}
        className="w-full mb-3 p-2 bg-zinc-800 text-white rounded"
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>

      <input
        type="number"
        placeholder="Баланс (₽)"
        className="w-full mb-6 p-2 bg-zinc-800 text-white rounded"
        value={balance}
        onChange={e => setBalance(Number(e.target.value))}
      />

      <button
        onClick={handleUpdate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Сохранить изменения
      </button>
    </div>
  )
}
