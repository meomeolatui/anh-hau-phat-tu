import { Copy, Expand, Heart, ImageDown } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { themeLabel } from '../../data/quotes'
import { cn } from '../../lib/cn'
import IconAction from './IconAction'
import { accentClass, toneOf } from './theme-style'

/** Một thẻ pháp ngữ trong danh sách dạng masonry. */
export default function QuoteTile({ quote, favorite, onToggleFavorite, onCopy, onShare, onContemplate, style }) {
  return (
    <article
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft transition hover:border-jade-200 sm:p-6 dark:border-white/5 dark:bg-night-2 dark:hover:border-jade-800"
      style={style}
      aria-labelledby={`q-${quote.id}`}
    >
      <span className={cn('absolute top-0 left-6 h-1 w-10 rounded-b-full', accentClass(quote.theme))} aria-hidden />
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge tone={toneOf(quote.theme)}>{themeLabel(quote.theme)}</Badge>
        {favorite && <span className="sr-only">Đã yêu thích</span>}
      </div>

      <blockquote>
        <p
          id={`q-${quote.id}`}
          className="font-serif text-[1.075rem] leading-relaxed text-stone-800 sm:text-lg dark:text-stone-100"
        >
          {quote.text}
        </p>
        {quote.gloss && (
          <p className="mt-2 text-sm leading-relaxed text-stone-500 italic dark:text-stone-400">{quote.gloss}</p>
        )}
        <footer className="mt-3 text-sm font-medium text-jade-700 dark:text-jade-300">— {quote.source}</footer>
      </blockquote>

      <div className="-mx-2 -mb-2 mt-4 flex items-center gap-0.5 border-t border-stone-100 pt-2 dark:border-white/5">
        <IconAction
          icon={Heart}
          label={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          active={favorite}
          aria-pressed={favorite}
          onClick={() => onToggleFavorite(quote)}
        />
        <IconAction icon={Copy} label="Sao chép" onClick={() => onCopy(quote)} />
        <IconAction icon={ImageDown} label="Tạo ảnh chia sẻ" onClick={() => onShare(quote)} />
        <button
          type="button"
          onClick={() => onContemplate(quote)}
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-jade-700 transition hover:bg-jade-50 dark:text-jade-300 dark:hover:bg-jade-900/40"
        >
          <Expand className="h-4 w-4" aria-hidden />
          Chiêm nghiệm
        </button>
      </div>
    </article>
  )
}
