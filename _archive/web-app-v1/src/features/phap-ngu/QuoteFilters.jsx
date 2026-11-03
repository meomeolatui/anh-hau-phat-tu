import { Heart, Library, Search, X } from 'lucide-react'
import Segmented from '../../components/ui/Segmented'
import { QUOTE_THEMES } from '../../data/quotes'
import { cn } from '../../lib/cn'

function Chip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap ring-1 transition ring-inset',
        active
          ? 'bg-jade-700 text-white ring-jade-700 dark:bg-jade-500 dark:text-jade-950 dark:ring-jade-500'
          : 'bg-white text-stone-700 ring-stone-200 hover:ring-jade-300 dark:bg-night-2 dark:text-stone-300 dark:ring-white/10 dark:hover:ring-jade-700',
      )}
    >
      {children}
      {count != null && (
        <span className={cn('text-xs tabular-nums', active ? 'text-white/80 dark:text-jade-950/70' : 'text-stone-400')}>{count}</span>
      )}
    </button>
  )
}

/** Thanh lọc: Tất cả/Yêu thích, ô tìm kiếm (gõ có dấu hay không dấu đều được) và chip chủ đề. */
export default function QuoteFilters({ tab, onTab, favCount, query, onQuery, theme, onTheme, counts }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          aria-label="Chọn danh sách"
          value={tab}
          onChange={onTab}
          options={[
            { value: 'all', label: 'Tất cả', icon: Library },
            { value: 'fav', label: `Yêu thích${favCount ? ` (${favCount})` : ''}`, icon: Heart },
          ]}
        />
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor="phap-ngu-search" className="sr-only">
            Tìm lời dạy
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            id="phap-ngu-search"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Tìm theo từ khoá, kinh, chủ đề…"
            autoComplete="off"
            className="h-11 w-full rounded-2xl border border-stone-300 bg-white pr-11 pl-11 text-base text-stone-900 placeholder:text-stone-400 focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none sm:text-sm dark:border-white/10 dark:bg-night-2 dark:text-stone-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery('')}
              aria-label="Xoá từ khoá"
              className="absolute top-1/2 right-1.5 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div
        role="group"
        aria-label="Lọc theo chủ đề"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        <Chip active={theme === 'all'} onClick={() => onTheme('all')} count={counts.all}>
          Tất cả chủ đề
        </Chip>
        {QUOTE_THEMES.map((t) => (
          <Chip key={t.id} active={theme === t.id} onClick={() => onTheme(t.id)} count={counts[t.id] ?? 0}>
            {t.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
