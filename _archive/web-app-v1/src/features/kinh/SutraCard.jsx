import { Link } from 'react-router-dom'
import { Clock, Heart, ListOrdered, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/cn'
import { toggleFavorite } from '../../lib/actions'
import { categoryLabel, categoryMeta } from './category-meta'
import { isInProgress, progressOf } from './reader'
import { relativeDayLabel } from './history'
import SutraGlyph from './SutraGlyph'

/** Nút yêu thích dùng chung cho thẻ và trình đọc. */
export function FavoriteButton({ id, title, active, className, size = 'md' }) {
  return (
    <button
      type="button"
      onClick={() => toggleFavorite('sutras', id)}
      aria-pressed={active}
      aria-label={active ? `Bỏ "${title}" khỏi yêu thích` : `Thêm "${title}" vào yêu thích`}
      title={active ? 'Bỏ yêu thích' : 'Yêu thích'}
      className={cn(
        'relative z-10 grid shrink-0 place-items-center transition',
        size === 'sm' ? 'h-9 w-9 rounded-full' : 'h-10 w-10 rounded-xl border border-stone-300 dark:border-stone-700',
        active
          ? 'bg-lotus-50 text-lotus-600 hover:bg-lotus-100 dark:bg-lotus-900/40 dark:text-lotus-300'
          : 'text-stone-400 hover:bg-stone-900/5 hover:text-lotus-600 dark:text-stone-500 dark:hover:bg-white/10 dark:hover:text-lotus-300',
        className,
      )}
    >
      <Heart className={cn('h-5 w-5', active && 'fill-current')} aria-hidden />
    </button>
  )
}

/**
 * Thẻ một bài kinh. Cả thẻ bấm được (liên kết "kéo giãn" phủ thẻ) nhưng nút yêu thích vẫn độc lập.
 * snippet/lineIndex: khi kết quả tìm kiếm khớp trong kinh văn → nhảy thẳng tới dòng đó.
 */
export default function SutraCard({ sutra, lineCount, favorite, bookmark, stat, snippet, lineIndex, className }) {
  const meta = categoryMeta(sutra.category)
  const Icon = meta.icon
  const reading = isInProgress(bookmark, lineCount)
  const href = lineIndex != null ? `/kinh/${sutra.id}?dong=${lineIndex + 1}` : `/kinh/${sutra.id}`

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft transition',
        'hover:-translate-y-0.5 hover:border-jade-300 hover:shadow-glow has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-jade-500',
        'dark:border-white/5 dark:bg-night-2 dark:hover:border-jade-700',
        className,
      )}
    >
      <div className={cn('pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br to-transparent blur-2xl', meta.glow)} aria-hidden />
      <SutraGlyph category={sutra.category} className={cn('pointer-events-none absolute top-5 right-16 opacity-15 transition group-hover:opacity-30', meta.accent)} />

      <div className="relative flex items-start justify-between gap-3">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', meta.chip)}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {categoryLabel(sutra.category)}
        </span>
        <FavoriteButton id={sutra.id} title={sutra.title} active={favorite} size="sm" className="-mt-1 -mr-1" />
      </div>

      <h3 className="relative mt-3 font-serif text-xl leading-snug font-semibold text-stone-900 dark:text-stone-50">
        <Link to={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
          {sutra.title}
        </Link>
      </h3>
      <p className="relative mt-0.5 text-sm text-stone-500 dark:text-stone-400">{sutra.subtitle}</p>

      {snippet ? (
        <p className="relative mt-3 rounded-2xl bg-jade-50/80 px-3.5 py-2.5 font-serif text-[15px] leading-relaxed text-jade-900 dark:bg-jade-900/30 dark:text-jade-100">
          <span className="mb-0.5 block font-sans text-[11px] font-semibold tracking-wider text-jade-600 uppercase dark:text-jade-400">
            Dòng {lineIndex + 1}
          </span>
          {snippet}
        </p>
      ) : (
        <p className="relative mt-3 line-clamp-2 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{sutra.description}</p>
      )}

      <div className="relative mt-auto pt-4">
        {reading && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-jade-700 dark:text-jade-300">
              <span className="inline-flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Đang đọc dở · dòng {bookmark + 1}/{lineCount}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-jade-500" style={{ width: `${Math.round(progressOf(bookmark, lineCount) * 100)}%` }} />
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />~{sutra.minutes} phút
          </span>
          <span className="inline-flex items-center gap-1">
            <ListOrdered className="h-3.5 w-3.5" aria-hidden />
            {lineCount} dòng
          </span>
          {stat && (
            <span className="text-jade-700 dark:text-jade-300">
              Đã tụng {stat.count} lần · {relativeDayLabel(stat.last)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
