// frontend/src/app/legal/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Shield, CreditCard, RotateCcw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Правовые документы | DonateRaid',
  description: 'Все правовые документы и соглашения DonateRaid'
}

const documents = [
  {
    href: '/legal/terms',
    title: 'Пользовательское соглашение',
    description: 'Условия использования сервиса DonateRaid, права и обязанности пользователей',
    icon: FileText,
    color: 'blue'
  },
  {
    href: '/legal/privacy',
    title: 'Политика конфиденциальности',
    description: 'Правила обработки и защиты персональных данных пользователей',
    icon: Shield,
    color: 'green'
  },
  {
    href: '/legal/offer',
    title: 'Публичная оферта',
    description: 'Официальное предложение на заключение договора об оказании услуг',
    icon: CreditCard,
    color: 'purple'
  },
  {
    href: '/legal/refund',
    title: 'Политика возврата',
    description: 'Условия и порядок возврата денежных средств и DonateCoin',
    icon: RotateCcw,
    color: 'orange'
  }
]

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400'
}

export default function LegalPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Правовые документы</h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Вся необходимая правовая информация о работе сервиса DonateRaid
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        {documents.map(({ href, title, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg border ${colorMap[color as keyof typeof colorMap]}`}>
                <Icon className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition">
                  {title}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-8 border border-zinc-200 dark:border-zinc-700">
        <h2 className="text-2xl font-bold mb-6">Важная информация</h2>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2 text-lg">📋 Обязательное ознакомление</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Используя наш сервис, вы автоматически соглашаетесь со всеми правовыми документами.
                Обязательно ознакомьтесь с ними перед началом работы.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-lg">🔄 Обновления документов</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Документы могут обновляться. При внесении изменений мы уведомляем пользователей
                и публикуем новые версии на данной странице.
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
            <h3 className="font-semibold mb-3 text-lg">📞 Контакты для правовых вопросов</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <strong>Email:</strong><br/>
                <a href="mailto:DonateRaid.Sup@yandex.ru" className="text-blue-600 hover:underline">
                  DonateRaid.Sup@yandex.ru
                </a>
              </div>
              <div>
                <strong>Telegram:</strong><br/>
                <a href="https://t.me/DonateRaid" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  @DonateRaid
                </a>
              </div>
              <div>
                <strong>ОГРНИП:</strong><br/>
                325028000112629
              </div>
              <div>
                <strong>ИНН:</strong><br/>
                860330130390
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 dark:text-blue-400 mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Вопросы по документам?
                </p>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Если у вас есть вопросы по любому из правовых документов,
                  не стесняйтесь обращаться в нашу поддержку. Мы всегда готовы помочь!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}