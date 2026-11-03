import { useMemo } from 'react'
import { HandHeart } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { DEED_CATEGORIES, getDeedCategory } from '../../data/good-deeds'
import { cn } from '../../lib/cn'
import { deedsByCategory } from './journal'
import { toneOf } from './ui'
import Glyph from './Glyph'

/** Phân bố thiện hạnh theo nhóm — thanh ngang, sắp nhiều nhất trước. */
export default function CategoryBreakdown({ logs, start, end, rangeLabel }) {
  const { total, items } = useMemo(() => deedsByCategory(logs, start, end, DEED_CATEGORIES), [logs, start, end])

  if (!total) {
    return (
      <EmptyState
        icon={HandHeart}
        title="Chưa có việc lành nào được ghi"
        description={`Trong ${rangeLabel} qua chưa có thiện hạnh nào. Một lời cảm ơn, một lần nhường đường cũng đáng ghi lại.`}
        className="py-8"
      />
    )
  }

  const top = items[0].count
  return (
    <div>
      <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
        <span className="font-semibold text-stone-900 tabular-nums dark:text-stone-100">{total}</span> việc lành trong {rangeLabel} qua.
      </p>
      <ul className="space-y-3.5">
        {items.map((item) => {
          const cat = getDeedCategory(item.id)
          const tone = toneOf(cat.tone)
          const pct = Math.round(item.share * 100)
          return (
            <li key={item.id}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-stone-800 dark:text-stone-200">
                  <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', tone.icon)}>
                    <Glyph name={cat.icon} className="h-4 w-4" />
                  </span>
                  <span className="truncate">{cat.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-stone-600 dark:text-stone-400">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{item.count}</span> · {pct}%
                </span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                aria-label={`${cat.label}: ${item.count} việc, ${pct}%`}
              >
                {/* Độ dài so với nhóm nhiều nhất để khác biệt nhỏ vẫn nhìn ra */}
                <div className={cn('h-full rounded-full transition-[width] duration-500', tone.bar)} style={{ width: `${Math.max(4, (item.count / top) * 100)}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
