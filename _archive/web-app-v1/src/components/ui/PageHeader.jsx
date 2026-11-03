import { useEffect } from 'react'
import { cn } from '../../lib/cn'

/** Tiêu đề trang + đặt document.title. */
export default function PageHeader({ title, subtitle, icon: Icon, actions, eyebrow, className }) {
  useEffect(() => {
    document.title = `${title} · Anh Hậu Phật Tử`
  }, [title])

  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-jade-500 to-jade-700 text-white shadow-glow">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
        )}
        <div>
          {eyebrow && <p className="mb-1 text-xs font-semibold tracking-widest text-jade-600 uppercase dark:text-jade-400">{eyebrow}</p>}
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-stone-600 sm:text-base dark:text-stone-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
