// frontend/src/app/legal/refund/page.tsx - ОБНОВЛЕННАЯ ДЛЯ ВОЗВРАТА НА БАЛАНС
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Политика возврата | DonateRaid',
  description: 'Условия возврата средств на баланс аккаунта'
}

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Политика возврата</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            💡 Важная информация
          </h3>
          <p className="text-blue-700 dark:text-blue-300">
            Все возвраты осуществляются исключительно на баланс вашего аккаунта на платформе DonateRaid.
            Возврат на банковскую карту или другие платежные методы не производится.
          </p>
        </div>

        <section>
          <h2>1. Общие принципы</h2>
          <p>
            Возврат средств осуществляется в соответствии с Законом РФ
            «О защите прав потребителей» и настоящей политикой.
          </p>
          <p>
            <strong>Все возвраты производятся только на внутренний баланс аккаунта</strong>
            и могут быть использованы для новых покупок на платформе.
          </p>
        </section>

        <section>
          <h2>2. Случаи возврата на баланс</h2>
          <p>Возврат средств на баланс возможен в следующих случаях:</p>
          <ul>
            <li>Невыполнение заказа по вине исполнителя</li>
            <li>Технические ошибки при оформлении заказа</li>
            <li>Двойное списание средств</li>
            <li>Отмена заказа до начала выполнения (не позднее 1 часа после оплаты)</li>
            <li>Несоответствие полученного товара описанию</li>
          </ul>
        </section>

        <section>
          <h2>3. Преимущества возврата на баланс</h2>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <ul className="text-green-800 dark:text-green-200">
              <li><strong>Мгновенное зачисление</strong> - средства поступают на баланс сразу после одобрения</li>
              <li><strong>Без комиссий</strong> - возврат на баланс происходит без удержания комиссий</li>
              <li><strong>Удобство использования</strong> - баланс можно потратить на любые товары</li>
              <li><strong>Накопительная система</strong> - объединяйте средства от возвратов с новыми пополнениями</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>4. Сроки возврата</h2>
          <ul>
            <li><strong>Рассмотрение заявки:</strong> до 24 часов</li>
            <li><strong>Зачисление на баланс:</strong> мгновенно после одобрения</li>
            <li><strong>Уведомление:</strong> вы получите SMS/email о зачислении</li>
          </ul>
        </section>

        <section>
          <h2>5. Как подать заявку на возврат</h2>
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg">
            <ol className="space-y-2">
              <li><strong>1.</strong> Войдите в личный кабинет и найдите нужный заказ</li>
              <li><strong>2.</strong> Нажмите "Запросить возврат" или обратитесь в поддержку</li>
              <li><strong>3.</strong> Укажите причину возврата и приложите документы (если есть)</li>
              <li><strong>4.</strong> Дождитесь рассмотрения заявки службой поддержки</li>
              <li><strong>5.</strong> Получите средства на баланс и уведомление</li>
            </ol>
          </div>
        </section>

        <section>
          <h2>6. Использование баланса</h2>
          <p>Средства на балансе можно использовать для:</p>
          <ul>
            <li>Покупки любых товаров и услуг на платформе</li>
            <li>Оплаты заказов полностью или частично</li>
            <li>Комбинирования с другими способами оплаты</li>
          </ul>
        </section>

        <section>
          <h2>7. Исключения</h2>
          <p>Возврат НЕ производится в следующих случаях:</p>
          <ul>
            <li>Услуга выполнена полностью и качественно</li>
            <li>Ошибка в данных по вине клиента</li>
            <li>Нарушение правил игры клиентом после выполнения услуги</li>
            <li>Попытка возврата спустя 30 дней после выполнения заказа</li>
            <li>Злоупотребление системой возвратов</li>
          </ul>
        </section>

        <section>
          <h2>8. Контакты для возврата</h2>
          <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
            <p className="mb-4"><strong>Служба поддержки DonateRaid:</strong></p>
            <ul className="space-y-1">
              <li><strong>Email:</strong> refund@donateraid.ru</li>
              <li><strong>Telegram:</strong> @donateraid_support</li>
              <li><strong>Чат на сайте:</strong> доступен 24/7</li>
              <li><strong>Время работы:</strong> ПН-ВС с 09:00 до 21:00 (МСК)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>9. Часто задаваемые вопросы</h2>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">Можно ли вернуть средства на карту?</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Нет, все возвраты производятся только на баланс аккаунта для вашего удобства и безопасности.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">Есть ли срок действия баланса?</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Баланс не имеет срока действия и может использоваться в любое время.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">Можно ли вывести баланс?</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Баланс предназначен только для покупок на платформе и не подлежит выводу.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}