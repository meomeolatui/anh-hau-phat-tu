import { ArrowRight, Heart, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { toggleFavorite } from '../../lib/actions'
import { cn } from '../../lib/cn'

/** Pháp ngữ hôm nay — đổi mỗi ngày, có thể lưu vào mục yêu thích. */
export default function QuoteCard({ quote }) {
  const favorites = useStore((s) => s.favorites.quotes)
  if (!quote) return null
  const saved = favorites?.includes(quote.id)

  return (
    <figure className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-lotus-100 bg-gradient-to-br from-lotus-50 via-white to-saffron-50 p-6 shadow-soft dark:border-white/5 dark:from-night-3 dark:via-night-2 dark:to-night-2">
      <Quote className="absolute -top-2 -right-2 h-24 w-24 rotate-180 text-lotus-200/60 dark:text-white/5" aria-hidden />
      <p className="text-xs font-semibold tracking-widest text-lotus-700 uppercase dark:text-lotus-300">Pháp ngữ hôm nay</p>
      <blockquote className="relative mt-3 flex-1 font-serif text-xl leading-relaxed text-stone-800 sm:text-2xl dark:text-stone-100">
        “{quote.text}”
      </blockquote>
      <figcaption className="mt-4 text-sm text-stone-600 dark:text-stone-400">— {quote.source}</figcaption>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => toggleFavorite('quotes', quote.id)}
          aria-pressed={saved}
          className={cn(
            'inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition',
            saved
              ? 'bg-lotus-100 text-lotus-700 dark:bg-lotus-900/40 dark:text-lotus-200'
              : 'text-stone-600 hover:bg-white/80 dark:text-stone-300 dark:hover:bg-white/5',
          )}
        >
          <Heart className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden />
          {saved ? 'Đã lưu' : 'Lưu lại'}
        </button>
        <Link
          to="/phap-ngu"
          className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium text-jade-700 transition hover:bg-white/80 dark:text-jade-300 dark:hover:bg-white/5"
        >
          Thêm pháp ngữ
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </figure>
  )
}
