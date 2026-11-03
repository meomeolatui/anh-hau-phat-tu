import { cn } from '../../lib/cn'

/** Khối nội dung bo góc, nền trắng ấm (sáng) / xanh đêm (tối). */
export default function Card({ as: Tag = 'div', className, padded = true, interactive = false, children, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-3xl border border-stone-200/70 bg-white shadow-soft dark:border-white/5 dark:bg-night-2',
        padded && 'p-5 sm:p-6',
        interactive && 'transition hover:-translate-y-0.5 hover:border-jade-300 hover:shadow-glow dark:hover:border-jade-700',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardTitle({ icon: Icon, children, action, className }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-stone-100">
        {Icon && <Icon className="h-5 w-5 text-jade-600 dark:text-jade-400" aria-hidden />}
        {children}
      </h2>
      {action}
    </div>
  )
}
