import { cn } from '../../lib/cn'

/** Nút chỉ có biểu tượng — luôn kèm aria-label và tooltip để ai cũng hiểu nút làm gì. */
export default function IconAction({ icon: Icon, label, onClick, active = false, activeClass, className, iconClass, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-xl transition',
        active
          ? activeClass ?? 'text-lotus-600 hover:bg-lotus-50 dark:text-lotus-400 dark:hover:bg-lotus-900/30'
          : 'text-stone-500 hover:bg-stone-900/5 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-stone-100',
        className,
      )}
      {...props}
    >
      <Icon className={cn('h-5 w-5', iconClass)} fill={active ? 'currentColor' : 'none'} aria-hidden />
    </button>
  )
}
