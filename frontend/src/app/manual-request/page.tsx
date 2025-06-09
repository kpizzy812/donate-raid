export default function ManualRequestPage() {
  return (
    <div className="py-6 space-y-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Заявка на донат в свою игру</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
        Если вашей игры нет в списке — вы можете оформить заявку вручную. Укажите, что именно вы хотите купить, и оператор свяжется с вами.
      </p>

      <form className="space-y-4">
        <input
          type="text"
          placeholder="Имя"
          className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
        />
        <input
          type="text"
          placeholder="Название игры"
          className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
        />
        <input
          type="text"
          placeholder="Сумма (₽)"
          className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
        />
        <textarea
          placeholder="Комментарий"
          rows={3}
          className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Отправить заявку
        </button>
      </form>
    </div>
  )
}
