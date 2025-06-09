'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchGameById } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'


export default function GamePage() {
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [selected, setSelected] = useState<number[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addItems } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)



  useEffect(() => {
    if (!id) return
    fetchGameById(parseInt(id as string)).then(setGame)
  }, [id])

  const toggleProduct = (productId: number) => {
    setSelected((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    selectedProducts.forEach((product) => {
      product.input_fields?.forEach((field) => {
        const key = `${product.id}.${field.name}`
        if (field.required && !inputs[key]) {
          newErrors[key] = 'Обязательное поле'
        }
      })
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addToCart = () => {
  console.log('🛒 addToCart вызвана')

  if (!validate()) {
    console.log('❌ Валидация не прошла')
    console.log('Ошибки:', errors)
    return
  }

  const cartItems = selectedProducts.map((product) => ({
    product: {
      id: product.id,
      game_id: game.id,
      name: product.name,
      price_rub: Number(product.price_rub),
    },
    inputs: (product.input_fields || []).reduce((acc, field) => {
      acc[field.name] = inputs[`${product.id}.${field.name}`] || ''
      return acc
    }, {} as Record<string, string>),
  }))

  console.log('🎯 selectedProducts:', selectedProducts)
  console.log('📦 cartItems для добавления:', cartItems)

  addItems(cartItems)

  toast(`Вы добавили ${cartItems.length} товар(а)`, {
    description: 'Перейдите в корзину для оформления заказа.',
    action: {
      label: 'Открыть',
      onClick: () => router.push('/order/cart'),
    },
  })
}





  const selectedProducts = game?.products?.filter((p) => selected.includes(p.id)) || []
  const totalPrice = selectedProducts.reduce((sum, p) => sum + Number(p.price_rub), 0)

  if (!game) return <div className="py-10 text-center">Загрузка...</div>

  return (
    <div className="py-6 space-y-6 max-w-3xl mx-auto">
      <div className="rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-700">
        <img src={game.banner_url} alt={game.name} className="w-full h-48 object-cover" />
      </div>

      <h1 className="text-2xl font-bold">{game.name}</h1>

      {game.auto_support ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {game.products.map((product) => (
              <div
                key={product.id}
                className={`border rounded-xl p-4 cursor-pointer transition dark:border-zinc-700 relative ${
                  selected.includes(product.id)
                    ? 'border-blue-500 ring-2 ring-blue-300'
                    : ''
                }`}
                onClick={() => !loading && toggleProduct(product.id)}
              >
                <div className="text-lg font-semibold">{product.name}</div>
                <div className="text-sm text-zinc-500">{product.price_rub} ₽</div>
                {selected.includes(product.id) && (
                  <div className="absolute top-2 right-2 text-blue-500">✔</div>
                )}
              </div>
            ))}
          </div>

          {selectedProducts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mt-6">Данные для заказа</h2>
              {selectedProducts.map((product) => (
                <div key={product.id} className="space-y-3">
                  {product.input_fields?.map((field) => {
                    const key = `${product.id}.${field.name}`
                    return (
                      <div key={key}>
                        <input
                          type={field.type || 'text'}
                          required={field.required}
                          placeholder={field.label}
                          className="w-full px-4 py-2 rounded-md border bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                          value={inputs[key] || ''}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                        />
                        {errors[key] && <p className="text-sm text-red-500 mt-1">{errors[key]}</p>}
                      </div>
                    )
                  })}
                </div>
              ))}

              <button
              onClick={addToCart}
              disabled={loading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md relative overflow-hidden"
            >
              {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <span className={loading ? 'opacity-0' : ''}>
                Купить за {totalPrice.toFixed(2)} ₽
              </span>
            </button>

            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-600 whitespace-pre-line dark:text-zinc-400">
            {game.instructions || 'Инструкция пока не указана.'}
          </p>
          <a
            href="https://t.me/your_support_bot"
            target="_blank"
            className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
          >
            Связаться с оператором
          </a>
        </>
      )}
    </div>
  )
}
