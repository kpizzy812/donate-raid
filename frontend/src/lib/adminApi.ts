export async function createGame(data: {
  name: string
  banner_url?: string
  instructions?: string
  auto_support?: boolean
  sort_order?: number
}, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка при создании игры')
  }

  return res.json();
}

