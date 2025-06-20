// frontend/src/app/faq/page.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqData = [
  {
    category: 'Общие вопросы',
    questions: [
      {
        question: 'Как работает DonateRaid?',
        answer: 'DonateRaid — это платформа для безопасного пополнения игровых счетов и покупки внутриигровой валюты. Мы работаем с проверенными поставщиками и гарантируем качество услуг.'
      },
      {
        question: 'Безопасно ли пользоваться вашими услугами?',
        answer: 'Да, абсолютно безопасно. Мы используем только официальные методы пополнения, не нарушающие правила игр. Все транзакции защищены, а ваши данные конфиденциальны.'
      },
      {
        question: 'Какие игры вы поддерживаете?',
        answer: 'Мы поддерживаем большинство популярных игр. Полный список доступен на главной странице. Если вашей игры нет в списке — обратитесь в поддержку для ручного оформления.'
      }
    ]
  },
  {
    category: 'Оплата и доставка',
    questions: [
      {
        question: 'Какие способы оплаты вы принимаете?',
        answer: 'Мы принимаем банковские карты, СБП, криптовалюты и другие популярные способы оплаты. Полный список доступен при оформлении заказа.'
      },
      {
        question: 'Как быстро выполняется заказ?',
        answer: 'Автоматические заказы выполняются в течение 5-30 минут. Ручные заказы обрабатываются в течение 1-24 часов в зависимости от сложности.'
      },
      {
        question: 'Что делать, если заказ не выполнен?',
        answer: 'Если заказ не выполнен в указанные сроки, средства автоматически возвращаются на ваш внутренний баланс. Вы также можете обратиться в поддержку для решения вопроса.'
      },
      {
        question: 'Можно ли получить возврат?',
        answer: 'Возврат возможен до начала выполнения заказа. После выполнения заказа возврат невозможен, кроме случаев нашей ошибки.'
      }
    ]
  },
  {
    category: 'Аккаунт и безопасность',
    questions: [
      {
        question: 'Как создать аккаунт?',
        answer: 'Для создания аккаунта достаточно указать email. Мы отправим вам ссылку для входа — никаких паролей запоминать не нужно.'
      },
      {
        question: 'Что такое внутренний баланс?',
        answer: 'Внутренний баланс — это ваши средства на платформе. Вы можете пополнить баланс и тратить его на любые игры. При отмене заказа средства возвращаются на баланс.'
      },
      {
        question: 'Нужно ли передавать пароль от игры?',
        answer: 'Это зависит от игры. Для большинства игр достаточно ID игрока или никнейма. Если нужен пароль — мы используем только безопасные методы и не сохраняем ваши данные.'
      }
    ]
  },
  {
    category: 'Поддержка',
    questions: [
      {
        question: 'Как связаться с поддержкой?',
        answer: 'Вы можете написать нам через чат на сайте, в Telegram или на странице поддержки. Мы отвечаем быстро и решаем любые вопросы.'
      },
      {
        question: 'В какое время работает поддержка?',
        answer: 'Поддержка работает 24/7. Среднее время ответа — 15 минут в рабочее время, до 2 часов в ночное время.'
      }
    ]
  }
]

interface FAQItemProps {
  question: string
  answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border rounded-lg border-zinc-300 dark:border-zinc-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700">
          <p className="pt-3">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Часто задаваемые вопросы</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ответы на популярные вопросы о работе DonateRaid
        </p>
      </div>

      <div className="space-y-8">
        {faqData.map((category, categoryIndex) => (
          <section key={categoryIndex}>
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
              {category.category}
            </h2>
            <div className="space-y-3">
              {category.questions.map((item, questionIndex) => (
                <FAQItem
                  key={questionIndex}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950 rounded-xl text-center">
        <h3 className="text-lg font-semibold mb-2">Не нашли ответ?</h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Свяжитесь с нашей поддержкой — мы поможем решить любой вопрос
        </p>
        <div className="space-x-4">
          <a
            href="/support"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition"
          >
            Открыть чат
          </a>
          <a
            href="https://t.me/donateraid"
            target="_blank"
            className="inline-block border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-2 rounded-md transition"
          >
            Telegram
          </a>
        </div>
      </div>
    </main>
  )
}