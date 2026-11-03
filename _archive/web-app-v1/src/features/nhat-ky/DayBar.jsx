import { useMemo } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, CircleDot, Timer, Undo2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import { addDaysKey, formatNumber, formatViDate, fromKey } from '../../lib/date'
import { getLunarDate } from '../../lib/lunar'
import { normalizeDayKey } from './journal'

/** Thanh chọn ngày: lùi/tiến từng ngày, chọn bằng lịch (tối đa hôm nay), xem âm lịch & số liệu tu tập. */
export default function DayBar({ dayKey, today, day, onChange }) {
  const date = fromKey(dayKey)
  const lunar = useMemo(() => getLunarDate(fromKey(dayKey)), [dayKey])
  const isToday = dayKey === today

  const practice = [
    { icon: CircleDot, value: day.niem, label: 'câu niệm' },
    { icon: Timer, value: day.thienMin, label: 'phút thiền' },
    { icon: BookOpen, value: day.tung, label: 'thời kinh' },
  ].filter((p) => p.value > 0)

  return (
    <section
      aria-label="Chọn ngày ghi nhật ký"
      className="relative overflow-hidden rounded-4xl border border-jade-100 bg-gradient-to-br from-jade-50 via-white to-lotus-50/60 p-5 shadow-soft sm:p-6 dark:border-white/5 dark:from-jade-950 dark:via-night-2 dark:to-night-2"
    >
      <div className="bg-lotus-pattern pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-jade-700 uppercase dark:text-jade-300">
            {isToday ? 'Hôm nay' : 'Đang xem ngày đã qua'}
          </p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-50">{formatViDate(date)}</h2>
          <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
            Âm lịch: ngày {lunar.day} {lunar.monthLabel}, năm {lunar.yearName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onChange(addDaysKey(dayKey, -1))} aria-label="Ngày trước">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Button>
          <label className="sr-only" htmlFor="nhat-ky-ngay">
            Chọn ngày
          </label>
          <input
            id="nhat-ky-ngay"
            type="date"
            value={dayKey}
            max={today}
            onChange={(e) => e.target.value && onChange(normalizeDayKey(e.target.value, today))}
            className="h-10 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none dark:border-white/10 dark:bg-night-3 dark:text-stone-100 dark:[color-scheme:dark]"
          />
          <Button variant="outline" size="icon" onClick={() => onChange(addDaysKey(dayKey, 1))} disabled={isToday} aria-label="Ngày sau">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
          {!isToday && (
            <Button variant="secondary" onClick={() => onChange(today)}>
              <Undo2 className="h-4 w-4" aria-hidden />
              Về hôm nay
            </Button>
          )}
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2 text-sm">
        {practice.length ? (
          practice.map(({ icon: Icon, value, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-stone-700 ring-1 ring-stone-200 dark:bg-white/5 dark:text-stone-200 dark:ring-white/10">
              <Icon className="h-4 w-4 text-jade-600 dark:text-jade-400" aria-hidden />
              <span className="font-semibold tabular-nums">{formatNumber(value)}</span> {label}
            </span>
          ))
        ) : (
          <span className="text-stone-500 dark:text-stone-400">
            {isToday ? 'Chưa có thời niệm Phật, thiền hay tụng kinh nào hôm nay.' : 'Ngày này chưa ghi nhận thời tu tập nào.'}
          </span>
        )}
      </div>
    </section>
  )
}
