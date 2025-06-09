// frontend/src/app/admin/users/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

interface User {
  id: number
  email?: string
  username?: string
  role: string
  balance: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    const params = search ? `?q=${search}` : ''
    try {
      const res = await api.get(`/admin/users${params}`)
      setUsers(res.data)
    } catch (err) {
      console.error('Ошибка загрузки пользователей', err)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search])

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Пользователи</h1>

      <input
        type="text"
        placeholder="Поиск по email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 p-2 bg-zinc-800 text-white rounded"
      />

      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-700">
          <tr>
            <th className="py-2">ID</th>
            <th>Email</th>
            <th>Username</th>
            <th>Роль</th>
            <th>Баланс (₽)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800">
              <td className="py-2 pr-2">{user.id}</td>
              <td>{user.email || '—'}</td>
              <td>{user.username || '—'}</td>
              <td>{user.role}</td>
              <td>{user.balance.toFixed(2)}</td>
              <td className="text-right">
                <Link
                  href={`/admin/users/${user.id}/edit`}
                  className="text-blue-500 hover:underline"
                >
                  Редактировать
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
