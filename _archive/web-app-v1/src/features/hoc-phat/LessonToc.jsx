import { useRef } from 'react'
import { ChevronDown, TableOfContents } from 'lucide-react'
import { cn } from '../../lib/cn'

/** Cuộn mượt tới mục và chuyển tiêu điểm vào đó (để trình đọc màn hình đọc tiếp từ đúng chỗ). */
function jumpTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  const target = el.querySelector('h2') ?? el
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}

function TocList({ items, active, onPick }) {
  return (
    <ol className="space-y-0.5">
      {items.map((item, i) => {
        const isActive = i === active
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                // Thu gọn mục lục trước khi cuộn, tránh lệch vị trí do bố cục co lại
                onPick?.()
                jumpTo(item.id)
              }}
              aria-current={isActive ? 'location' : undefined}
              className={cn(
                'flex gap-2.5 rounded-xl border-l-2 px-3 py-2 text-sm leading-snug transition',
                isActive
                  ? 'border-jade-600 bg-jade-50 font-medium text-jade-800 dark:border-jade-400 dark:bg-jade-900/40 dark:text-jade-100'
                  : 'border-transparent text-stone-600 hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100',
              )}
            >
              <span className="w-4 shrink-0 tabular-nums text-stone-400">{item.marker}</span>
              <span>{item.label}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )
}

/** Mục lục cố định bên cạnh bài viết (máy tính). */
export function TocSidebar({ items, active, progress }) {
  return (
    <nav aria-label="Mục lục bài học" className="sticky top-8 hidden max-h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-none lg:block">
      <p className="mb-3 flex items-center gap-2 px-3 text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">
        <TableOfContents className="h-4 w-4" aria-hidden />
        Mục lục
      </p>
      <TocList items={items} active={active} />
      <div className="mt-5 px-3">
        <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>Đã đọc</span>
          <span className="tabular-nums">{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10" aria-hidden>
          <div className="h-full rounded-full bg-jade-500 transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </nav>
  )
}

/** Mục lục thu gọn đặt đầu bài (di động / máy tính bảng). */
export function TocInline({ items, active }) {
  const ref = useRef(null)
  // Chọn xong thì thu gọn để không che nội dung vừa nhảy tới
  const close = () => {
    if (ref.current) ref.current.open = false
  }
  return (
    <details ref={ref} className="group mb-6 rounded-3xl border border-stone-200/70 bg-white shadow-soft lg:hidden dark:border-white/5 dark:bg-night-2">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-5 py-3 font-medium text-stone-800 dark:text-stone-200">
        <TableOfContents className="h-5 w-5 text-jade-600 dark:text-jade-400" aria-hidden />
        Mục lục
        <span className="ml-1 text-sm font-normal text-stone-500">({items.length} phần)</span>
        <ChevronDown className="ml-auto h-5 w-5 text-stone-400 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-stone-200/70 p-2 dark:border-white/5">
        <TocList items={items} active={active} onPick={close} />
      </div>
    </details>
  )
}
