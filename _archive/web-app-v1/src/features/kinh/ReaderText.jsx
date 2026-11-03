import { Link } from 'react-router-dom'
import { ArrowUpRight, Hand } from 'lucide-react'
import { cn } from '../../lib/cn'
import { splitRepeat } from './reader'

/**
 * Cột kinh văn: mỗi dòng là một nút — bấm để nhảy tới (đặt mốc đọc / tụng tiếp từ đó).
 * `lineRef(index, el)` để trang cha cuộn tới dòng đang tụng.
 */
export default function ReaderText({ sections, lines, active, playing, fontSize, onSelect, lineRef }) {
  return (
    <div className="mx-auto max-w-[42rem]" style={{ fontSize }}>
      {sections.map((sec) => (
        <section key={sec.key} className="mb-10 last:mb-0" aria-label={sec.heading ?? undefined}>
          {sec.heading && <SectionHeading heading={sec.heading} refItem={sec.ref} />}
          {sec.note && (
            <p className="mx-auto mb-5 flex max-w-md items-start justify-center gap-2 rounded-2xl bg-stone-100/80 px-4 py-2.5 text-left font-sans text-sm leading-relaxed text-stone-600 dark:bg-white/5 dark:text-stone-400">
              <Hand className="mt-0.5 h-4 w-4 shrink-0 text-saffron-600 dark:text-saffron-400" aria-hidden />
              <span>{sec.note}</span>
            </p>
          )}
          <div className="space-y-1">
            {lines.slice(sec.start, sec.end).map((line) => (
              <Line
                key={line.index}
                line={line}
                state={line.index === active ? 'active' : playing && line.index < active ? 'past' : 'idle'}
                playing={playing}
                onSelect={onSelect}
                lineRef={lineRef}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function SectionHeading({ heading, refItem }) {
  return (
    <div className="mb-4 flex flex-col items-center gap-1.5 text-center">
      <span className="flex items-center gap-3 text-saffron-500/80 dark:text-saffron-400/70" aria-hidden>
        <span className="h-px w-8 bg-current" />
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-current">
          <path d="M6 0 7.4 4.6 12 6 7.4 7.4 6 12 4.6 7.4 0 6l4.6-1.4Z" />
        </svg>
        <span className="h-px w-8 bg-current" />
      </span>
      <h2 className="font-sans text-sm font-semibold tracking-[0.12em] text-jade-700 uppercase dark:text-jade-300">{heading}</h2>
      {refItem && (
        <Link
          to={`/kinh/${refItem.id}`}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-xs font-medium text-stone-500 underline-offset-2 hover:text-jade-700 hover:underline dark:text-stone-400 dark:hover:text-jade-300"
        >
          Mở bài riêng & lược giải
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}

function Line({ line, state, playing, onSelect, lineRef }) {
  const { main, marker } = splitRepeat(line.text)
  return (
    <button
      type="button"
      ref={(el) => lineRef(line.index, el)}
      onClick={() => onSelect(line.index)}
      aria-current={state === 'active' ? 'true' : undefined}
      aria-label={`Dòng ${line.index + 1}: ${line.text}`}
      className={cn(
        'block w-full scroll-my-40 rounded-2xl px-3 py-1.5 text-center font-serif leading-[1.85] transition-[background-color,color,box-shadow,transform] duration-300',
        'hover:bg-stone-900/[0.03] dark:hover:bg-white/[0.04]',
        state === 'idle' && 'text-stone-800 dark:text-stone-100',
        state === 'past' && 'text-stone-400 dark:text-stone-500',
        state === 'active' &&
          (playing
            ? 'scale-[1.015] bg-jade-100/80 text-jade-950 shadow-sm ring-1 ring-jade-300/70 dark:bg-jade-800/50 dark:text-white dark:ring-jade-600/50'
            : 'bg-saffron-50 text-stone-900 ring-1 ring-saffron-200 hover:bg-saffron-50 dark:bg-saffron-900/20 dark:text-stone-50 dark:ring-saffron-800/60'),
      )}
    >
      {main}
      {marker && (
        <span className="ml-2 inline-block rounded-full bg-jade-50 px-2 align-middle font-sans text-[0.6em] font-semibold text-jade-700 dark:bg-jade-900/50 dark:text-jade-300">
          {marker}
        </span>
      )}
    </button>
  )
}
