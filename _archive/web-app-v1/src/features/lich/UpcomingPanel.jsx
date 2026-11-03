import { useMemo } from 'react'
import { CalendarClock, Leaf } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Card, { CardTitle } from '../../components/ui/Card'
import { fromKey, formatShortDate, WEEKDAYS_SHORT_VI } from '../../lib/date'
import { getFastingScheme, upcomingFastingDays, upcomingHolidays } from '../../data/holidays'
import { cn } from '../../lib/cn'
import { getLunarDate } from '../../lib/lunar'
import { relativeDayLabel } from './day-info'

const KIND_LABEL = { le: 'Đại lễ', via: 'Ngày vía', tet: 'Rằm lớn' }

function DateBlock({ date, tone }) {
  return (
    <span
      className={cn(
        'grid h-14 w-14 shrink-0 place-content-center rounded-2xl text-center',
        tone === 'saffron'
          ? 'bg-saffron-100 text-saffron-900 dark:bg-saffron-500/15 dark:text-saffron-100'
          : 'bg-jade-50 text-jade-900 dark:bg-jade-900/40 dark:text-jade-100',
      )}
    >
      <span className="text-[11px] leading-none font-medium opacity-80">{WEEKDAYS_SHORT_VI[date.getDay()]}</span>
      <span className="mt-1 text-lg leading-none font-semibold tabular-nums">{date.getDate()}</span>
      <span className="mt-0.5 text-[10px] leading-none opacity-70">th {date.getMonth() + 1}</span>
    </span>
  )
}

/** Danh sách ngày lễ/vía và ngày chay sắp tới; bấm vào để xem trên lịch. */
export default function UpcomingPanel({ today, fasting, onSelectDate }) {
  const { holidays, fastingDays } = useMemo(() => {
    const from = fromKey(today)
    // Lấy ngày âm thực tế: vía ngày 30 gặp tháng thiếu được cử hành ngày 29
    const holidays = upcomingHolidays(from, 6).map((h) => ({ ...h, lunar: getLunarDate(h.date) }))
    return { holidays, fastingDays: upcomingFastingDays(fasting, from, 4) }
  }, [today, fasting])
  const scheme = getFastingScheme(fasting)

  return (
    <Card>
      <CardTitle icon={CalendarClock}>Sắp tới</CardTitle>
      <ol className="space-y-2">
        {holidays.map((h) => (
          <li key={`${h.id}-${h.date.getTime()}`}>
            <button
              type="button"
              onClick={() => onSelectDate(h.date)}
              className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-stone-50 dark:hover:bg-white/5"
            >
              <DateBlock date={h.date} tone="saffron" />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 font-medium leading-snug text-stone-900 dark:text-stone-100">{h.name}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                  <span>
                    {h.lunar.day}/{h.lunar.month} âm lịch
                  </span>
                  <Badge tone={h.kind === 'via' ? 'lotus' : 'saffron'}>{KIND_LABEL[h.kind]}</Badge>
                </span>
              </span>
              <span
                className={cn(
                  'w-16 shrink-0 text-right text-sm leading-tight font-semibold tabular-nums',
                  h.daysLeft <= 7 ? 'text-saffron-700 dark:text-saffron-300' : 'text-stone-500 dark:text-stone-400',
                )}
              >
                {relativeDayLabel(h.daysLeft)}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-5 border-t border-stone-200/70 pt-4 dark:border-white/5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
          <Leaf className="h-4 w-4 text-jade-600 dark:text-jade-400" aria-hidden />
          Ngày chay sắp tới
        </h3>
        {fastingDays.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {scheme.days.length ? 'Không có ngày chay nào trong 60 ngày tới.' : 'Chọn một lối ăn chay để ứng dụng nhắc giúp bạn.'}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {fastingDays.map((d) => (
              <li key={d.date.getTime()}>
                <button
                  type="button"
                  onClick={() => onSelectDate(d.date)}
                  className="rounded-2xl border border-jade-200 bg-jade-50/60 px-3 py-2 text-left transition hover:border-jade-400 dark:border-jade-800 dark:bg-jade-900/30 dark:hover:border-jade-600"
                >
                  <span className="block text-sm font-semibold text-jade-900 dark:text-jade-100">
                    {WEEKDAYS_SHORT_VI[d.date.getDay()]} {formatShortDate(d.date)}
                  </span>
                  <span className="block text-xs text-jade-700 dark:text-jade-300">
                    {d.lunar.day}/{d.lunar.month} âm · {relativeDayLabel(d.daysLeft)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
