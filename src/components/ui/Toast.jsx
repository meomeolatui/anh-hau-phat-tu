import { useCallback, useMemo, useRef, useState } from 'react'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ToastContext } from './toast-context'

const ICONS = { success: CircleCheck, info: Info, warning: TriangleAlert }
const TONES = {
  success: 'text-jade-600 dark:text-jade-400',
  info: 'text-sky-600 dark:text-sky-400',
  warning: 'text-saffron-600 dark:text-saffron-400',
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), [])

  /** toast({ title, description?, tone?: 'success'|'info'|'warning', duration? }) */
  const toast = useCallback(
    ({ title, description, tone = 'success', duration = 3500 }) => {
      const id = ++counter.current
      setItems((xs) => [...xs.slice(-2), { id, title, description, tone }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {items.map((t) => {
          const Icon = ICONS[t.tone] ?? Info
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-white/10 dark:bg-night-3/95"
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONES[t.tone])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{t.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} className="text-stone-400 hover:text-stone-600" aria-label="Đóng thông báo">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
