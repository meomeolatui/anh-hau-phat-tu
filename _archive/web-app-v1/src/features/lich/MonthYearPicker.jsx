import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { cn } from '../../lib/cn'
import { formatShortDate } from '../../lib/date'
import { canChiYear, lunarToDate } from '../../lib/lunar'
import { clampYear, MAX_YEAR, MIN_YEAR, MONTH_LABELS } from './month-grid'

/** Hộp chọn nhanh tháng/năm — nhảy xa (vd. tra ngày giỗ năm cũ) mà không phải bấm từng tháng. */
export default function MonthYearPicker({ open, onClose, view, onPick }) {
  return (
    <Modal open={open} onClose={onClose} title="Chọn tháng" description="Chọn năm rồi bấm vào tháng muốn xem." size="sm">
      {/* Mount lại mỗi lần mở để năm khởi đầu luôn khớp tháng đang xem */}
      {open && <PickerBody view={view} onPick={onPick} />}
    </Modal>
  )
}

function PickerBody({ view, onPick }) {
  const [year, setYear] = useState(view.year)
  const [draft, setDraft] = useState(String(view.year))
  // Ngày Tết giúp người dùng biết năm âm nào phủ phần lớn năm dương này
  const tet = lunarToDate(1, 1, year)

  const commit = (y) => {
    const next = clampYear(y)
    setYear(next)
    setDraft(String(next))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={() => commit(year - 1)} disabled={year <= MIN_YEAR} aria-label="Năm trước">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Button>
        <div className="text-center">
          <label htmlFor="lich-picker-year" className="sr-only">
            Năm dương lịch
          </label>
          <input
            id="lich-picker-year"
            type="number"
            inputMode="numeric"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              const n = Number(e.target.value)
              if (Number.isInteger(n) && n >= MIN_YEAR && n <= MAX_YEAR) setYear(n)
            }}
            onBlur={() => commit(Number(draft) || year)}
            className="w-28 rounded-xl border border-transparent bg-transparent text-center font-serif text-2xl font-semibold text-stone-900 tabular-nums hover:border-stone-200 focus:border-jade-500 focus:outline-none dark:text-stone-50 dark:hover:border-white/10"
          />
          {tet && (
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Tết {canChiYear(year)}: {formatShortDate(tet)}
            </p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => commit(year + 1)} disabled={year >= MAX_YEAR} aria-label="Năm sau">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {MONTH_LABELS.map((label, month) => {
          const current = year === view.year && month === view.month
          return (
            <button
              key={label}
              type="button"
              aria-pressed={current}
              onClick={() => onPick({ year, month })}
              className={cn(
                'h-12 rounded-2xl text-sm font-medium transition',
                current
                  ? 'bg-jade-700 text-white dark:bg-jade-500 dark:text-jade-950'
                  : 'bg-stone-100 text-stone-700 hover:bg-jade-50 hover:text-jade-800 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-jade-900/40',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
