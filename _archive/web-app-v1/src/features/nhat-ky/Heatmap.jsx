import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import { addDaysKey, formatViDate, fromKey } from '../../lib/date'
import { cn } from '../../lib/cn'
import { buildHeatmap, describeDay } from './journal'

const WEEKS = 26
const ROW_LABELS = ['T2', '', 'T4', '', 'T6', '', 'CN']
const ROW_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật']

// Thang tuần tự một màu (jade) từ nhạt đến đậm; tối thì đảo bước sáng cho nổi trên nền đêm
const LEVELS = [
  'bg-stone-100 dark:bg-white/[0.06]',
  'bg-jade-200 dark:bg-jade-900',
  'bg-jade-300 dark:bg-jade-700',
  'bg-jade-500 dark:bg-jade-500',
  'bg-jade-700 dark:bg-jade-300',
]
const LEVEL_NAMES = ['Chưa tu tập', 'Nhẹ nhàng', 'Đều đặn', 'Tinh tấn', 'Rất tinh tấn']

/**
 * Lịch nhiệt 26 tuần. Dạng bảng (hàng = thứ, cột = tuần) để trình đọc màn hình đọc được;
 * di chuyển bằng phím mũi tên (roving tabindex) thay vì 182 điểm dừng Tab.
 */
export default function Heatmap({ logs, goals, today, onOpenDay }) {
  const { columns, months } = useMemo(() => buildHeatmap(logs, goals, today, WEEKS), [logs, goals, today])
  const [active, setActive] = useState(today)
  const [hover, setHover] = useState(null)
  const scrollRef = useRef(null)
  const firstKey = columns[0].key

  // Trên di động bảng rộng hơn màn hình → cuộn sẵn về tuần hiện tại
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  const activeDays = useMemo(
    () => columns.reduce((n, c) => n + c.cells.filter((x) => !x.future && x.level > 0).length, 0),
    [columns],
  )

  const headerCells = useMemo(() => {
    const out = []
    let cursor = 0
    for (let i = 0; i < months.length; i++) {
      const m = months[i]
      if (m.index > cursor) out.push({ key: `gap-${cursor}`, label: '', span: m.index - cursor })
      const next = months[i + 1]?.index ?? WEEKS
      out.push({ key: `m-${m.index}`, label: m.label, span: next - m.index })
      cursor = next
    }
    if (cursor < WEEKS) out.push({ key: `gap-${cursor}`, label: '', span: WEEKS - cursor })
    return out
  }, [months])

  const focusKey = (key) => {
    const clamped = key < firstKey ? firstKey : key > today ? today : key
    setActive(clamped)
    // Đợi React cập nhật tabIndex rồi mới chuyển focus
    requestAnimationFrame(() => scrollRef.current?.querySelector(`[data-key="${clamped}"]`)?.focus())
  }

  const onKeyDown = (e) => {
    const moves = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }
    if (e.key in moves) {
      e.preventDefault()
      focusKey(addDaysKey(active, moves[e.key]))
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusKey(firstKey)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusKey(today)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onOpenDay(active)
    }
  }

  const shownKey = hover ?? active
  const shownDay = logs[shownKey]

  return (
    <div>
      <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
        <span className="font-semibold text-stone-900 tabular-nums dark:text-stone-100">{activeDays}</span> ngày có tu tập trong {WEEKS} tuần gần đây.
      </p>

      <div ref={scrollRef} className="-mx-2 overflow-x-auto px-2 pb-2" onPointerLeave={() => setHover(null)}>
        <table
          role="grid"
          aria-label={`Lịch nhiệt tu tập ${WEEKS} tuần gần nhất. Dùng phím mũi tên để di chuyển, Enter để mở ngày.`}
          className="border-separate border-spacing-[3px] sm:border-spacing-1"
          onKeyDown={onKeyDown}
        >
          <thead>
            <tr>
              <th scope="col" className="w-6">
                <span className="sr-only">Thứ</span>
              </th>
              {headerCells.map((h) => (
                // Nhãn đặt tuyệt đối để chữ dài không làm phình cột (tháng bắt đầu ở tuần cuối chỉ có 1 cột)
                <th key={h.key} scope="colgroup" colSpan={h.span} className="relative h-5 p-0">
                  <span className="absolute top-0 left-0 text-[11px] font-medium whitespace-nowrap text-stone-500 dark:text-stone-400">{h.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_LABELS.map((label, row) => (
              <tr key={row}>
                <th scope="row" className="pr-1 text-right text-[11px] leading-none font-medium text-stone-500 dark:text-stone-400">
                  <span aria-hidden>{label}</span>
                  <span className="sr-only">{ROW_NAMES[row]}</span>
                </th>
                {columns.map((col) => {
                  const cell = col.cells[row]
                  if (cell.future) return <td key={cell.key} className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-[18px] lg:w-[18px]" aria-hidden />
                  const selected = cell.key === active
                  return (
                    <td
                      key={cell.key}
                      data-key={cell.key}
                      tabIndex={selected ? 0 : -1}
                      aria-selected={selected}
                      aria-label={`${describeDay(cell.key, cell.day)}. ${LEVEL_NAMES[cell.level]}`}
                      title={describeDay(cell.key, cell.day)}
                      onClick={() => setActive(cell.key)}
                      onDoubleClick={() => onOpenDay(cell.key)}
                      onPointerEnter={() => setHover(cell.key)}
                      className={cn(
                        'h-3.5 w-3.5 cursor-pointer rounded-[4px] p-0 transition sm:h-4 sm:w-4 lg:h-[18px] lg:w-[18px]',
                        LEVELS[cell.level],
                        'hover:ring-2 hover:ring-jade-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-500',
                        selected && 'ring-2 ring-stone-800 ring-offset-1 ring-offset-white dark:ring-stone-100 dark:ring-offset-night-2',
                        cell.key === today && !selected && 'ring-1 ring-jade-600 dark:ring-jade-300',
                      )}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400" aria-hidden>
          <span className="mr-1">Ít</span>
          {LEVELS.map((cls, i) => (
            <span key={i} className={cn('h-3.5 w-3.5 rounded-[4px]', cls)} title={LEVEL_NAMES[i]} />
          ))}
          <span className="ml-1">Nhiều</span>
        </div>
        <p className="sr-only">Màu càng đậm là ngày tu tập càng đầy đủ so với mục tiêu niệm Phật, thiền và việc lành.</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-white/5" aria-live="polite">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{formatViDate(fromKey(shownKey))}</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">{describeDay(shownKey, shownDay).split(': ')[1]}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onOpenDay(shownKey)}>
          Mở nhật ký ngày này
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
