import { cn } from '../../lib/cn'

const TONES = {
  jade: 'bg-jade-50 text-jade-800 ring-jade-200 dark:bg-jade-900/40 dark:text-jade-200 dark:ring-jade-800',
  lotus: 'bg-lotus-50 text-lotus-700 ring-lotus-200 dark:bg-lotus-900/30 dark:text-lotus-200 dark:ring-lotus-800',
  saffron: 'bg-saffron-50 text-saffron-800 ring-saffron-200 dark:bg-saffron-900/30 dark:text-saffron-200 dark:ring-saffron-800',
  stone: 'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-white/5 dark:text-stone-300 dark:ring-white/10',
}

export default function Badge({ tone = 'jade', className, children }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[tone], className)}
    >
      {children}
    </span>
  )
}
