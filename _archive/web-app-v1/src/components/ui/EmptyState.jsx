import { cn } from '../../lib/cn'

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 px-6 py-10 text-center dark:border-white/10', className)}>
      {Icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-jade-50 text-jade-600 dark:bg-jade-900/40 dark:text-jade-300">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      <p className="font-medium text-stone-800 dark:text-stone-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
