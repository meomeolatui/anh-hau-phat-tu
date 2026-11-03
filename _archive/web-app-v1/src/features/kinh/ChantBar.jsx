import { CircleCheck, Drum, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import Segmented from '../../components/ui/Segmented'
import { cn } from '../../lib/cn'
import { formatDuration } from '../../lib/date'
import { PACES, progressOf } from './reader'
import { useTicker } from './hooks'

const PACE_OPTIONS = PACES.map((p) => ({ value: p.value, label: p.label }))

/** Thời gian đã đọc (chỉ tính khi trang hiển thị) — tách riêng để chỉ ô này render lại mỗi giây. */
function Elapsed({ clock }) {
  useTicker(1000)
  return <span className="tabular-nums">{formatDuration(clock.read())}</span>
}

/**
 * Thanh điều khiển "Tụng theo": phát/dừng, lùi/tới dòng, nhịp, bật/tắt mõ, hoàn thành.
 * Dính ở đáy màn hình, chừa chỗ cho thanh điều hướng di động.
 */
export default function ChantBar({
  active,
  total,
  playing,
  remaining,
  pace,
  mo,
  clock,
  focus,
  onToggle,
  onPrev,
  onNext,
  onPace,
  onMo,
  onComplete,
}) {
  const pct = Math.round(progressOf(active, total) * 100)
  return (
    <div className={cn('sticky z-20 mt-6', focus ? 'bottom-4' : 'bottom-24 lg:bottom-6')}>
      <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200/80 bg-white/90 p-3 shadow-xl backdrop-blur-xl sm:p-4 dark:border-white/10 dark:bg-night-2/90">
        <div
          className="mb-3 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10"
          role="progressbar"
          aria-label="Tiến độ bài tụng"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-jade-400 to-jade-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <IconButton label="Dòng trước" onClick={onPrev} disabled={active <= 0}>
              <SkipBack className="h-5 w-5" aria-hidden />
            </IconButton>
            <button
              type="button"
              onClick={onToggle}
              aria-label={playing ? 'Tạm dừng tụng theo' : 'Bắt đầu tụng theo'}
              className="grid h-14 w-14 place-items-center rounded-full bg-jade-700 text-white shadow-glow transition hover:bg-jade-800 active:scale-95 dark:bg-jade-500 dark:text-jade-950 dark:hover:bg-jade-400"
            >
              {playing ? <Pause className="h-6 w-6 fill-current" aria-hidden /> : <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />}
            </button>
            <IconButton label="Dòng tiếp theo" onClick={onNext} disabled={active >= total - 1}>
              <SkipForward className="h-5 w-5" aria-hidden />
            </IconButton>
          </div>

          <div className="min-w-0 flex-1" aria-live="off">
            <p className="text-sm font-semibold text-stone-900 tabular-nums dark:text-stone-50">
              Dòng {active + 1}
              <span className="font-normal text-stone-400">/{total}</span>
            </p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">
              {playing ? `còn ~${formatDuration(remaining)}` : 'Bấm phát để tụng theo'} · đã đọc <Elapsed clock={clock} />
            </p>
          </div>

          <button
            type="button"
            onClick={() => onMo(!mo)}
            aria-pressed={mo}
            aria-label={mo ? 'Tắt tiếng mõ mỗi dòng' : 'Bật tiếng mõ mỗi dòng'}
            title="Gõ mõ mỗi dòng"
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition',
              mo
                ? 'bg-saffron-100 text-saffron-800 dark:bg-saffron-900/40 dark:text-saffron-200'
                : 'text-stone-400 hover:bg-stone-900/5 dark:text-stone-500 dark:hover:bg-white/10',
            )}
          >
            <Drum className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-stone-500 sm:inline dark:text-stone-400">Nhịp</span>
            <Segmented options={PACE_OPTIONS} value={pace} onChange={onPace} size="sm" aria-label="Nhịp tụng" />
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-saffron-100 px-3 text-sm font-semibold text-saffron-900 transition hover:bg-saffron-200 dark:bg-saffron-900/40 dark:text-saffron-100 dark:hover:bg-saffron-900/60"
          >
            <CircleCheck className="h-4 w-4" aria-hidden />
            Hoàn thành
          </button>
        </div>
      </div>
    </div>
  )
}

function IconButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center rounded-full text-stone-600 transition hover:bg-stone-900/5 disabled:pointer-events-none disabled:opacity-35 dark:text-stone-300 dark:hover:bg-white/10"
      {...props}
    >
      {children}
    </button>
  )
}
