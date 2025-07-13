// frontend/src/app/legal/refund/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Политика возврата | DonateRaid',
  description: 'Условия возврата денежных средств и DonateCoin'
}

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Политика возврата</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
        <p className="text-zinc-600 dark:text-zinc-400">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}
        </p>

        <section>
          <h2>Общие положения</h2>
          <p>
            Настоящая Политика возврата является дополнением к{' '}
            <a href="/legal/terms" className="text-blue-600 hover:underline">
              Пользовательскому соглашению
            </a>{' '}
            и регулирует порядок возврата денежных средств и DonateCoin Принципалу.
          </p>
          <p>
            Агентом выступает Индивидуальный предприниматель Губайдуллин Р.А. (ИП
            Губайдуллин Р.А.), зарегистрированный в соответствии с законодательством
            Российской Федерации и осуществляющий деятельность через сайт
            https://donateraid.ru.
          </p>
        </section>

        <section>
          <h2>Случаи возврата средств</h2>
          <p>Возврат средств производится в следующих случаях:</p>
          <ul>
            <li>
              Заказ не был выполнен по вине Агента (например, техническая
              невозможность доставки).
            </li>
            <li>
              Принципал получил неверный цифровой код (ключ), и факт подтверждён
              видеозаписью процесса покупки и активации, позволяющей достоверно
              установить ошибку.
            </li>
            <li>
              По усмотрению Агента, при наличии обоснованных причин.
            </li>
          </ul>
        </section>

        <section>
          <h2>Случаи отказа в возврате</h2>
          <p>Возврат средств <strong>не производится</strong> в следующих случаях:</p>
          <ul>
            <li>Услуга была оказана, и заказ доставлен.</li>
            <li>Отсутствует видеозапись момента активации цифрового кода.</li>
            <li>
              Произведено пополнение внутреннего счёта на Сервисе (DonateCoin), и
              средства не использованы — возврат возможен только в DonateCoin, если
              иное не предусмотрено.
            </li>
            <li>Принципал указал неверные данные доставки.</li>
            <li>
              Принципал не изучил описание услуги или приобрёл товар, не
              соответствующий его ожиданиям.
            </li>
          </ul>
        </section>

        <section>
          <h2>Особые условия</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-lg font-semibold mb-2">⚠️ Важно знать:</h3>
            <ul>
              <li>
                <strong>Внутренний баланс в DonateCoin</strong> не является электронными денежными
                средствами в понимании Федерального закона №161-ФЗ и не подлежит
                возврату или выводу в рубли.
              </li>
              <li>
                Возврат может быть осуществлён только в DonateCoin и в пределах
                условий, предусмотренных настоящей Политикой возврата.
              </li>
              <li>
                Решение о возврате принимается в течение <strong>7 рабочих дней</strong> после
                обращения Принципала.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Как подать заявку на возврат</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-2">📧 Порядок обращения:</h3>
            <ol>
              <li>
                Отправьте письмо на <strong>admin@donateraid.ru</strong>
              </li>
              <li>
                В теме письма укажите: <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">
                  Возврат / Refund
                </code>
              </li>
              <li>
                В письме подробно опишите причину возврата
              </li>
              <li>
                Приложите подтверждающие материалы:
                <ul className="mt-2">
                  <li>• Видеозапись процесса активации (если применимо)</li>
                  <li>• Скриншоты ошибок</li>
                  <li>• Другие доказательства проблемы</li>
                </ul>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2>Сроки рассмотрения</h2>
          <div className="space-y-3">
            <div>
              <strong>Рассмотрение заявки:</strong> до 7 рабочих дней с момента получения
            </div>
            <div>
              <strong>Возврат средств:</strong> в течение 3-10 рабочих дней после одобрения
            </div>
            <div>
              <strong>Уведомление о решении:</strong> направляется на email, с которого было
              отправлено обращение
            </div>
          </div>
        </section>

        <section>
          <h2>Контактная информация</h2>
          <div className="space-y-2">
            <div><strong>Email для возвратов:</strong> DonateRaid.Sup@yandex.ru</div>
            <div><strong>Общая поддержка:</strong> DonateRaid.Sup@yandex.ru</div>
            <div><strong>Telegram:</strong> @DonateRaid</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
              ИП Губайдуллин Родион Азаматович<br/>
              ОГРНИП: 325028000112629 | ИНН: 860330130390
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}