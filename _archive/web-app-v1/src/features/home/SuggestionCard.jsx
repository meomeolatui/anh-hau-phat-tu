import { ArrowRight, BookOpen, CircleDot, HandHeart, Heart, Leaf, Lightbulb, MapPin, Moon, NotebookPen, Sunrise, Wind } from 'lucide-react'
import { Link } from 'react-router-dom'

const ICONS = {
  book: BookOpen,
  moon: Moon,
  sunrise: Sunrise,
  heart: Heart,
  notebook: NotebookPen,
  map: MapPin,
  beads: CircleDot,
  leaf: Leaf,
  hand: HandHeart,
  wind: Wind,
}

/** Một gợi ý duy nhất theo ngữ cảnh — ít lựa chọn giúp dễ bắt đầu hơn. */
export default function SuggestionCard({ suggestion }) {
  const Icon = ICONS[suggestion.icon] ?? Lightbulb
  return (
    <section
      aria-labelledby="suggest-title"
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-200/70 bg-gradient-to-br from-saffron-50 via-white to-jade-50 p-6 shadow-soft dark:border-white/5 dark:from-saffron-900/20 dark:via-night-2 dark:to-jade-950/60"
    >
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-saffron-200/40 blur-2xl dark:bg-saffron-500/10" aria-hidden />
      <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-saffron-700 uppercase dark:text-saffron-300">
        <Lightbulb className="h-4 w-4" aria-hidden />
        Gợi ý cho bạn
      </p>
      <div className="mt-4 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-saffron-600 shadow-sm dark:bg-white/10 dark:text-saffron-300">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="suggest-title" className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-50">
            {suggestion.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{suggestion.text}</p>
        </div>
      </div>
      <div className="mt-auto pt-5">
        <Link
          to={suggestion.to}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-jade-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-jade-800 dark:bg-jade-500 dark:text-jade-950 dark:hover:bg-jade-400"
        >
          {suggestion.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
