import { cn } from '../../lib/cn'

const TONES = {
  jade: 'bg-jade-50 text-jade-700 dark:bg-jade-900/40 dark:text-jade-300',
  lotus: 'bg-lotus-50 text-lotus-600 dark:bg-lotus-900/30 dark:text-lotus-300',
  saffron: 'bg-saffron-50 text-saffron-700 dark:bg-saffron-900/30 dark:text-saffron-300',
  stone: 'bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300',
}

/** Ô số liệu nhỏ: icon + giá trị + nhãn. */
export default function Stat({ icon: Icon, label, value, hint, tone = 'jade', className }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 dark:border-white/5 dark:bg-night-2', className)}>
      {Icon && (
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', TONES[tone])}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">{value}</p>
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">{label}</p>
        {hint && <p className="truncate text-xs text-stone-400 dark:text-stone-500">{hint}</p>}
      </div>
    </div>
  )
}
