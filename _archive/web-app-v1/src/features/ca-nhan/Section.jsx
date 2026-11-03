import { cn } from '../../lib/cn'

/**
 * Khung một mục trong trang Hồ sơ: có id để nhảy tới từ thanh mục lục (và từ link ngoài như /ca-nhan#cai-dat).
 * scroll-mt chừa chỗ cho thanh tiêu đề dính trên di động.
 */
export default function Section({ id, icon: Icon, title, description, action, className, children }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        'scroll-mt-24 rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft sm:p-6 dark:border-white/5 dark:bg-night-2',
        className,
      )}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-jade-50 text-jade-700 dark:bg-jade-900/40 dark:text-jade-300">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
          )}
          <div>
            <h2 id={`${id}-title`} className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
