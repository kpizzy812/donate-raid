import Link from 'next/link'

type Props = {
  game: {
    id: number
    name: string
    banner_url: string
  }
}

export default function GameCard({ game }: Props) {
  return (
    <Link
      href={`/game/${game.id}`}
      className="flex flex-col items-center transition hover:scale-105"
    >
      <div className="w-full min-w-[160px] aspect-square rounded-2xl overflow-hidden shadow border-2 border-transparent hover:border-blue-500 transition">
        <img
          src={game.banner_url}
          alt={game.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="mt-2 text-center text-sm font-medium text-zinc-100">
        {game.name}
      </div>
    </Link>
  )
}
