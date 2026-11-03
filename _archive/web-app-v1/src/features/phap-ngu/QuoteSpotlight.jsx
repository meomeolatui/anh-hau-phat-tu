import { Copy, Expand, Heart, ImageDown, RotateCcw, Shuffle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { themeLabel } from '../../data/quotes'
import IconAction from './IconAction'
import { toneOf } from './theme-style'

const MODE_LABEL = {
  today: 'Pháp ngữ hôm nay',
  drawn: 'Lời dạy dành cho bạn',
  linked: 'Lời dạy bạn đang xem',
}

/** Hoạ tiết hoa sen mảnh vẽ tay, đặt mờ ở góc thẻ. */
function LotusOrnament({ className }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M100 30c18 22 26 44 26 66s-8 40-26 52c-18-12-26-30-26-52s8-44 26-66Z" />
      <path d="M100 148c-10-26-34-46-70-52 2 30 20 52 70 52Z" />
      <path d="M100 148c10-26 34-46 70-52-2 30-20 52-70 52Z" />
      <path d="M100 148c-22-14-48-18-80-10 14 18 40 22 80 10Z" opacity=".6" />
      <path d="M100 148c22-14 48-18 80-10-14 18-40 22-80 10Z" opacity=".6" />
      <path d="M40 166h120" strokeLinecap="round" />
      <circle cx="100" cy="100" r="92" opacity=".35" strokeDasharray="2 6" />
    </svg>
  )
}

/**
 * Thẻ lớn ở đầu trang: pháp ngữ hôm nay, hoặc lời dạy vừa rút.
 * `flipping` = true trong lúc đổi câu để tạo hiệu ứng lật (CSS toàn cục tự tắt khi người dùng giảm chuyển động).
 */
export default function QuoteSpotlight({
  quote,
  mode = 'today',
  dateLabel,
  flipping,
  favorite,
  drawScopeLabel,
  onDraw,
  onBackToday,
  onToggleFavorite,
  onCopy,
  onShare,
  onContemplate,
}) {
  return (
    <section
      aria-labelledby="spotlight-title"
      className="relative overflow-hidden rounded-4xl border border-jade-100 bg-gradient-to-br from-jade-50 via-paper to-lotus-50 p-6 shadow-soft sm:p-10 dark:border-white/5 dark:from-jade-950 dark:via-night-2 dark:to-night-3"
    >
      <div className="bg-lotus-pattern pointer-events-none absolute inset-0" aria-hidden />
      <LotusOrnament className="pointer-events-none absolute -right-10 -bottom-12 h-64 w-64 text-jade-600/10 sm:h-80 sm:w-80 dark:text-jade-300/10" />
      <span
        className="pointer-events-none absolute top-2 left-4 font-serif text-[9rem] leading-none text-jade-600/10 select-none sm:left-8 sm:text-[12rem] dark:text-jade-300/10"
        aria-hidden
      >
        “
      </span>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="spotlight-title" className="text-xs font-semibold tracking-widest text-jade-700 uppercase dark:text-jade-300">
            {MODE_LABEL[mode]}
          </h2>
          {mode === 'today' && dateLabel && (
            <span className="text-xs text-stone-500 dark:text-stone-400">· {dateLabel}</span>
          )}
        </div>

        <div
          aria-live="polite"
          className="mt-5 min-h-48 sm:min-h-56"
          style={{
            transform: flipping ? 'perspective(1400px) rotateX(70deg) translateY(-12px)' : 'none',
            opacity: flipping ? 0 : 1,
            transition: 'transform 300ms ease, opacity 300ms ease',
            transformOrigin: '50% 0%',
          }}
        >
          <Badge tone={toneOf(quote.theme)}>{themeLabel(quote.theme)}</Badge>
          <blockquote className="mt-4">
            <p className="max-w-3xl font-serif text-2xl leading-snug font-medium text-balance text-stone-900 sm:text-[2rem] sm:leading-[1.35] dark:text-stone-50">
              {quote.text}
            </p>
            {quote.gloss && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600 italic dark:text-stone-300">{quote.gloss}</p>
            )}
            <footer className="mt-5 flex items-center gap-3 text-sm font-semibold text-jade-800 sm:text-base dark:text-jade-200">
              <span className="h-px w-8 bg-saffron-400" aria-hidden />
              {quote.source}
            </footer>
          </blockquote>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button size="lg" onClick={onDraw} disabled={flipping} aria-describedby={drawScopeLabel ? 'draw-scope' : undefined}>
            <Shuffle className="h-5 w-5" aria-hidden />
            Rút một lời dạy
          </Button>
          <Button size="lg" variant="outline" onClick={() => onContemplate(quote)}>
            <Expand className="h-5 w-5" aria-hidden />
            Chiêm nghiệm
          </Button>
          <div className="flex items-center gap-0.5 rounded-2xl bg-white/70 p-1 ring-1 ring-stone-200/70 backdrop-blur dark:bg-white/5 dark:ring-white/10">
            <IconAction
              icon={Heart}
              label={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
              active={favorite}
              aria-pressed={favorite}
              onClick={() => onToggleFavorite(quote)}
            />
            <IconAction icon={Copy} label="Sao chép" onClick={() => onCopy(quote)} />
            <IconAction icon={ImageDown} label="Tạo ảnh chia sẻ" onClick={() => onShare(quote)} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
          {drawScopeLabel && <p id="draw-scope">{drawScopeLabel}</p>}
          {mode !== 'today' && (
            <button
              type="button"
              onClick={onBackToday}
              className="inline-flex items-center gap-1.5 rounded-lg py-1 font-medium text-jade-700 underline-offset-4 hover:underline dark:text-jade-300"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Về pháp ngữ hôm nay
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
