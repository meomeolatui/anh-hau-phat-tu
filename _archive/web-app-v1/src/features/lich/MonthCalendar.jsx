import { useEffect, useId, useMemo, useRef } from 'react'
import { CalendarCheck, ChevronDown, ChevronLeft, ChevronRight, Leaf } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { cn } from '../../lib/cn'
import { LUNAR_MONTH_NAMES } from '../../lib/lunar'
import { buildMonthGrid, isKeyInRange, keyAfterNavigation, MAX_YEAR, MIN_YEAR, WEEK_HEADERS } from './month-grid'
import { cellAriaLabel, cellLunarLabel, describeDay } from './day-info'
import CalendarLegend from './CalendarLegend'

const SWIPE_MIN = 50

function lunarMonthName(l) {
  return `tháng ${LUNAR_MONTH_NAMES[l.month - 1]}${l.leap ? ' nhuận' : ''}`
}

/** "Tháng Chín – tháng Mười năm Bính Ngọ" — tháng âm tương ứng với tháng dương đang xem. */
function lunarSpanLabel(cells) {
  const inMonth = cells.filter((c) => c.inMonth)
  const a = inMonth[0].lunar
  const b = inMonth.at(-1).lunar
  const text =
    a.year === b.year
      ? `${lunarMonthName(a)} – ${lunarMonthName(b)} năm ${b.yearName}`
      : `${lunarMonthName(a)} ${a.yearName} – ${lunarMonthName(b)} ${b.yearName}`
  return `Âm lịch: ${text}`
}

function DayCell({ info, inMonth, selected, column, onSelect, onKeyDown }) {
  const holiday = info.holidays.length > 0
  const sunday = column === 6
  return (
    <div role="gridcell" aria-selected={selected} className="min-w-0">
      <button
        type="button"
        data-key={info.key}
        tabIndex={selected ? 0 : -1}
        aria-label={cellAriaLabel(info, WEEK_HEADERS[column].long)}
        aria-current={info.isToday ? 'date' : undefined}
        onClick={() => onSelect(info.key)}
        onKeyDown={onKeyDown}
        className={cn(
          'relative flex h-16 w-full flex-col justify-between rounded-xl p-1 text-left transition sm:h-20 sm:rounded-2xl sm:p-2 lg:h-24',
          'focus-visible:outline-offset-1',
          holiday
            ? 'bg-saffron-50 ring-1 ring-saffron-200 ring-inset hover:bg-saffron-100 dark:bg-saffron-500/10 dark:ring-saffron-500/25 dark:hover:bg-saffron-500/15'
            : 'hover:bg-stone-100 dark:hover:bg-white/5',
          selected &&
            'bg-jade-50 ring-2 ring-jade-600 hover:bg-jade-50 dark:bg-jade-900/50 dark:ring-jade-400 dark:hover:bg-jade-900/50',
          !inMonth && 'opacity-40',
        )}
      >
        <span className="flex items-start justify-between gap-0.5">
          <span
            className={cn(
              'grid h-6 min-w-6 place-items-center rounded-full text-[15px] font-semibold tabular-nums sm:h-8 sm:min-w-8 sm:text-lg',
              info.isToday
                ? 'bg-jade-700 text-white shadow-sm dark:bg-jade-500 dark:text-jade-950'
                : sunday
                  ? 'text-lotus-700 dark:text-lotus-300'
                  : 'text-stone-900 dark:text-stone-100',
            )}
          >
            {info.date.getDate()}
          </span>
          {info.fasting && (
            <Leaf className="mt-0.5 h-3 w-3 shrink-0 text-jade-600 sm:h-4 sm:w-4 dark:text-jade-400" aria-hidden />
          )}
        </span>

        {holiday && (
          <span className="hidden truncate text-[11px] leading-tight font-medium text-saffron-800 lg:block dark:text-saffron-200">
            {info.holidays[0].short}
          </span>
        )}

        <span className="flex items-end justify-between gap-0.5">
          <span className="flex items-center gap-1">
            {info.active && <span className="h-1.5 w-1.5 rounded-full bg-jade-500 sm:h-2 sm:w-2 dark:bg-jade-400" />}
            {holiday && <span className="h-1.5 w-1.5 rounded-full bg-saffron-500 lg:hidden" />}
          </span>
          <span
            className={cn(
              'truncate text-[11px] leading-none tabular-nums sm:text-xs',
              info.socVong
                ? 'rounded-full bg-lotus-100 px-1 py-0.5 font-semibold text-lotus-800 dark:bg-lotus-500/20 dark:text-lotus-200'
                : info.lunar.day === 1
                  ? 'font-semibold text-stone-700 dark:text-stone-300'
                  : 'text-stone-500 dark:text-stone-400',
            )}
          >
            {cellLunarLabel(info.lunar)}
          </span>
        </span>
      </button>
    </div>
  )
}

/**
 * Lưới tháng âm – dương theo mẫu ARIA date grid: một ô có tabIndex=0 (ngày đang chọn),
 * phím mũi tên di chuyển, PageUp/PageDown đổi tháng (Shift: đổi năm).
 */
export default function MonthCalendar({
  view,
  selectedKey,
  today,
  fasting,
  logs,
  onSelect,
  onShiftMonth,
  onToday,
  onOpenPicker,
}) {
  const gridRef = useRef(null)
  const focusPending = useRef(false)
  const touch = useRef(null)
  const helpId = useId()

  const weeks = useMemo(() => {
    return buildMonthGrid(view.year, view.month).map((week) =>
      week.map((c) => ({ ...describeDay(c.date, { fasting, logs, today }), inMonth: c.inMonth })),
    )
  }, [view.year, view.month, fasting, logs, today])

  const lunarSpan = useMemo(() => lunarSpanLabel(weeks.flat()), [weeks])

  // Sau khi di chuyển bằng bàn phím (có thể sang tháng khác) mới chuyển focus vào ô mới
  useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    gridRef.current?.querySelector(`[data-key="${selectedKey}"]`)?.focus()
  }, [selectedKey, weeks])

  const handleKeyDown = (e) => {
    const next = keyAfterNavigation(selectedKey, e.key, e.shiftKey)
    if (!next) return
    e.preventDefault()
    if (!isKeyInRange(next)) return
    focusPending.current = true
    onSelect(next)
  }

  const onTouchStart = (e) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchEnd = (e) => {
    if (!touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    touch.current = null
    // Chỉ coi là vuốt ngang khi đủ dài và rõ ràng nằm ngang, để không cản cuộn trang
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return
    onShiftMonth(dx < 0 ? 1 : -1)
  }

  const atMin = view.year <= MIN_YEAR && view.month === 0
  const atMax = view.year >= MAX_YEAR && view.month === 11
  const title = `Tháng ${view.month + 1}, ${view.year}`

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 p-4 sm:p-5 dark:border-white/5">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onOpenPicker}
            aria-haspopup="dialog"
            aria-label={`${title} — chọn tháng, năm khác`}
            className="group -mx-2 flex items-center gap-1.5 rounded-xl px-2 py-1 hover:bg-stone-100 dark:hover:bg-white/5"
          >
            <span className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-50">{title}</span>
            <ChevronDown className="h-5 w-5 text-stone-500 transition group-hover:translate-y-0.5" aria-hidden />
          </button>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{lunarSpan}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={onToday} className="h-10 rounded-xl px-3">
            <CalendarCheck className="h-4 w-4" aria-hidden />
            Hôm nay
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onShiftMonth(-1)} disabled={atMin} aria-label="Tháng trước">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onShiftMonth(1)} disabled={atMax} aria-label="Tháng sau">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="p-2 sm:p-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div role="grid" aria-label={`Lịch ${title}`} aria-describedby={helpId} ref={gridRef}>
          <div role="rowgroup">
            <div role="row" className="mb-1 grid grid-cols-7 gap-1 sm:gap-1.5">
              {WEEK_HEADERS.map((w, i) => (
                <div
                  key={w.short}
                  role="columnheader"
                  aria-label={w.long}
                  className={cn(
                    'py-1.5 text-center text-xs font-semibold tracking-wide uppercase',
                    i === 6 ? 'text-lotus-700 dark:text-lotus-300' : 'text-stone-500 dark:text-stone-400',
                  )}
                >
                  {w.short}
                </div>
              ))}
            </div>
          </div>
          <div role="rowgroup" key={`${view.year}-${view.month}`} className="animate-fade-up space-y-1 sm:space-y-1.5">
            {weeks.map((week) => (
              <div role="row" key={week[0].key} className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {week.map((info, i) => (
                  <DayCell
                    key={info.key}
                    info={info}
                    inMonth={info.inMonth}
                    selected={info.key === selectedKey}
                    column={i}
                    onSelect={onSelect}
                    onKeyDown={handleKeyDown}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p id={helpId} className="sr-only">
          Dùng phím mũi tên để chuyển ngày, Page Up và Page Down để đổi tháng, giữ Shift để đổi năm.
        </p>
      </div>

      <div className="border-t border-stone-200/70 bg-stone-50/60 px-4 py-3 sm:px-5 dark:border-white/5 dark:bg-white/[0.02]">
        <CalendarLegend />
        <p className="mt-2 text-xs text-stone-500 lg:hidden dark:text-stone-500">Mẹo: vuốt trái/phải trên lịch để đổi tháng.</p>
      </div>
    </Card>
  )
}
