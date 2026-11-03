import { cn } from '../../lib/cn'

/**
 * Nhóm lựa chọn dạng "pill".
 * options: [{ value, label, icon? }]
 */
export default function Segmented({ options, value, onChange, className, size = 'md', 'aria-label': ariaLabel }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex flex-wrap gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-white/5', className)}
    >
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              active
                ? 'bg-white text-jade-800 shadow-sm dark:bg-jade-800 dark:text-white'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100',
            )}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
