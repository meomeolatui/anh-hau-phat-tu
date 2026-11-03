import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { openPanel } from '../state'

/** Bảng phủ giữa màn hình cho Nhiệm vụ / Bản đồ / Menu. Esc hoặc bấm nền để đóng. */
export default function Sheet({ title, subtitle, children, wide = false }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  const close = () => openPanel(null)
  return (
    <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]" onClick={close} aria-hidden />
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[88dvh] w-full animate-fade-up overflow-y-auto rounded-t-4xl bg-paper p-5 text-stone-800 shadow-2xl outline-none sm:rounded-4xl sm:p-7 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-stone-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-stone-600">{subtitle}</p>}
          </div>
          <button type="button" onClick={close} className="rounded-full p-2 text-stone-500 hover:bg-stone-900/5" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
