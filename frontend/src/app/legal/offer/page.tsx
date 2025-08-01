// frontend/src/app/legal/offer/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Публичная оферта | DonateRaid',
  description: 'Публичная оферта на оказание услуг DonateRaid'
}

export default function OfferPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Публичная оферта</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
        <p className="text-zinc-600 dark:text-zinc-400">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}
        </p>

        <section>
          <h2>Преамбула</h2>
          <p>
            Настоящая публичная оферта (далее — «Оферта») представляет собой
            официальное предложение ИП Губайдуллин Р.А. (далее именуемый «Агент»), на
            заключение агентского договора на условиях, описанных в Оферте,
            адресованного дееспособным физическим лицам, принявшим (акцептовавшим)
            настоящее предложение.
          </p>
          <p>
            В соответствии с пунктом 2 статьи 437 ГК РФ документ является
            публичной Офертой и в случае принятия изложенных ниже условий и оплаты
            услуг Агента, лицо, осуществившее Акцепт настоящей Оферты, становится
            Принципалом.
          </p>
        </section>

        <section>
          <h2>1. Предмет договора</h2>
          <p>
            Агент обязуется по поручению Принципала за вознаграждение совершать от своего имени,
            но за счет Принципала юридические и иные действия по приобретению цифровых товаров
            и услуг для компьютерных игр и развлекательных платформ.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2">Услуги включают:</h3>
            <ul>
              <li>Покупку внутриигровой валюты</li>
              <li>Приобретение косметических предметов</li>
              <li>Покупку игровых пропусков и подписок</li>
              <li>Приобретение других цифровых товаров для игр</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>2. Порядок оказания услуг</h2>
          <ol>
            <li>
              <strong>Размещение заказа:</strong> Принципал размещает заказ на сайте
              https://donateraid.ru, указывая необходимые данные для доставки товара.
            </li>
            <li>
              <strong>Оплата:</strong> После размещения заказа Принципал производит
              его оплату доступными способами.
            </li>
            <li>
              <strong>Обработка:</strong> Агент получает средства от Принципала,
              конвертирует их в DonateCoin и осуществляет покупку указанного товара.
            </li>
            <li>
              <strong>Доставка:</strong> Приобретенный товар доставляется Принципалу
              способом, указанным в заказе.
            </li>
          </ol>
        </section>

        <section>
          <h2>3. Права и обязанности Агента</h2>

          <h3>Агент обязан:</h3>
          <ul>
            <li>Осуществлять прием денежных средств по запросам Принципала</li>
            <li>Конвертировать полученные средства в DonateCoin для последующего оказания услуг</li>
            <li>Вести учет DonateCoin, причитающихся Принципалу</li>
            <li>Своевременно исполнять поручения Принципала по приобретению товаров</li>
            <li>Предоставлять Принципалу отчет о выполненных действиях</li>
            <li>Обеспечивать конфиденциальность данных Принципала</li>
          </ul>

          <h3>Агент имеет право:</h3>
          <ul>
            <li>Получать вознаграждение за оказанные услуги</li>
            <li>Отказаться от выполнения поручения при нарушении Принципалом условий договора</li>
            <li>Требовать от Принципала предоставления точных данных для выполнения поручения</li>
            <li>Приостанавливать оказание услуг при технических неполадках</li>
          </ul>
        </section>

        <section>
          <h2>4. Права и обязанности Принципала</h2>

          <h3>Принципал обязан:</h3>
          <ul>
            <li>Своевременно и в полном объеме оплачивать услуги Агента</li>
            <li>Предоставлять точные и достоверные данные для выполнения поручения</li>
            <li>Не нарушать правила игровых платформ при использовании приобретенных товаров</li>
            <li>Уведомлять Агента об изменении данных, необходимых для оказания услуг</li>
          </ul>

          <h3>Принципал имеет право:</h3>
          <ul>
            <li>Получать услуги в соответствии с условиями настоящей Оферты</li>
            <li>Получать информацию о ходе выполнения поручения</li>
            <li>Требовать возмещения убытков при неисполнении Агентом своих обязательств</li>
          </ul>
        </section>

        <section>
          <h2>5. Стоимость услуг и порядок расчетов</h2>

          <div className="space-y-4">
            <div>
              <strong>Валюта расчетов:</strong> Все операции на сайте осуществляются в DonateCoin,
              получаемых путем конвертации российских рублей.
            </div>

            <div>
              <strong>Минимальная сумма пополнения:</strong> 100 рублей до конвертации в DonateCoin.
            </div>

            <div>
              <strong>Комиссии:</strong> Размер вознаграждения Агента указывается на сайте
              для каждого товара отдельно и включается в итоговую стоимость.
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="font-semibold">⚠️ Важно:</p>
              <p>
                Платежные системы и банки могут удерживать дополнительные комиссии
                за перевод и конвертацию денежных средств, не зависящие от Агента.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>6. Ответственность сторон</h2>

          <h3>Агент не несет ответственности за:</h3>
          <ul>
            <li>Блокировку или ограничение аккаунта Принципала со стороны игровых платформ</li>
            <li>Изменение правил игровых платформ, влияющих на возможность оказания услуг</li>
            <li>Технические неполадки на стороне игровых платформ</li>
            <li>Убытки, возникшие вследствие предоставления Принципалом неточных данных</li>
          </ul>

          <h3>Принципал несет ответственность за:</h3>
          <ul>
            <li>Достоверность предоставленных данных</li>
            <li>Соблюдение правил игровых платформ</li>
            <li>Своевременную оплату услуг</li>
          </ul>
        </section>

        <section>
          <h2>7. Форс-мажор</h2>
          <p>
            Стороны освобождаются от ответственности за частичное или полное неисполнение
            обязательств по настоящему договору, если это неисполнение явилось следствием
            обстоятельств непреодолимой силы: стихийных бедствий, военных действий,
            изменений в законодательстве, технических сбоев и других обстоятельств,
            находящихся вне контроля сторон.
          </p>
        </section>

        <section>
          <h2>8. Разрешение споров</h2>
          <ol>
            <li>
              До обращения в суд обязательным является предъявление претензии
              (письменного предложения о добровольном урегулировании спора).
            </li>
            <li>
              Получатель претензии в течение 30 рабочих дней со дня получения
              письменно уведомляет заявителя о результатах рассмотрения.
            </li>
            <li>
              При недостижении соглашения спор передается на рассмотрение в
              судебный орган в соответствии с действующим законодательством РФ.
            </li>
          </ol>
        </section>

        <section>
          <h2>9. Заключительные положения</h2>
          <ul>
            <li>
              Настоящая Оферта вступает в силу с момента акцепта (совершения Принципалом
              действий по оплате услуг) и действует до полного исполнения обязательств сторонами.
            </li>
            <li>
              Агент имеет право в одностороннем порядке изменять условия настоящей Оферты,
              размещая новую редакцию на сайте.
            </li>
            <li>
              К отношениям сторон применяется действующее законодательство Российской Федерации.
            </li>
          </ul>
        </section>

        <section>
          <h2>10. Контактная информация Агента</h2>
          <div className="space-y-2">
            <div><strong>Индивидуальный предприниматель Губайдуллин Родион Азаматович</strong></div>
            <div><strong>ОГРНИП:</strong> 325028000112629</div>
            <div><strong>ИНН:</strong> 860330130390</div>
            <div><strong>Адрес места жительства:</strong> Российская Федерация</div>
            <div><strong>Email:</strong> DonateRaid.Sup@yandex.ru</div>
            <div><strong>Telegram:</strong> @DonateRaid</div>
            <div><strong>Сайт:</strong> https://donateraid.ru</div>
          </div>
        </section>
      </div>
    </div>
  )
}