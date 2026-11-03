import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Khung giao diện chung cho mọi hoạt động: thẻ kính mờ neo ở CẠNH PHẢI (máy tính) hoặc
 * PHÍA TRÊN dưới thanh công đức (điện thoại) — chừa phần giữa/dưới màn hình để thấy rõ
 * nhân vật đang lạy, thắp hương, ngồi niệm… (camera cũng tự dịch khung hình, xem Hud.jsx).
 */
export default function Panel({ title, subtitle, onClose, children, className, wide = false }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[10.5rem] z-30 flex justify-center px-3 sm:inset-x-auto sm:top-20 sm:right-5 sm:bottom-5 sm:items-start sm:px-0">
      <section
        role="dialog"
        aria-label={title}
        className={cn(
          'pointer-events-auto max-h-[42dvh] w-full max-w-md animate-fade-up overflow-y-auto overscroll-contain rounded-4xl border border-white/40 bg-white/85 p-4 text-stone-800 shadow-2xl backdrop-blur-xl sm:max-h-full sm:p-6',
          wide ? 'sm:w-[min(520px,46vw)] sm:max-w-none' : 'sm:w-[380px]',
          className,
        )}
      >
        <header className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-stone-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-stone-600">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 -mr-1 rounded-full p-2 text-stone-500 hover:bg-stone-900/5"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>
        {children}
      </section>
    </div>
  )
}

/** Nút lớn dùng trong hoạt động */
export function ActionButton({ tone = 'jade', className, children, ...props }) {
  const tones = {
    jade: 'bg-jade-700 text-white hover:bg-jade-800 active:bg-jade-900',
    saffron: 'bg-saffron-500 text-white hover:bg-saffron-600',
    lotus: 'bg-lotus-600 text-white hover:bg-lotus-700',
    ghost: 'bg-stone-900/5 text-stone-800 hover:bg-stone-900/10',
  }
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition select-none disabled:opacity-50',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
