import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Hộp thoại (dialog) có nền mờ. Đóng bằng Esc, bấm nền, hoặc nút X.
 * Trên di động hiển thị dạng "bottom sheet".
 */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md', className }) {
  const panelRef = useRef(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab' && panelRef.current) {
        // Giữ focus trong hộp thoại
        const nodes = panelRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative max-h-[92vh] w-full animate-fade-up overflow-y-auto rounded-t-4xl bg-white p-6 shadow-2xl outline-none sm:rounded-4xl dark:bg-night-2',
          widths[size],
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>
        {title && (
          <h2 id={titleId} className="pr-10 text-lg font-semibold text-stone-900 dark:text-stone-50">
            {title}
          </h2>
        )}
        {description && (
          <p id={descId} className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {description}
          </p>
        )}
        <div className={cn(title || description ? 'mt-5' : '')}>{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
