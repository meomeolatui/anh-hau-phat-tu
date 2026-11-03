import { useMemo } from 'react'
import { ArrowRight, Leaf, Sparkles } from 'lucide-react'
import { fromKey, formatShortDate, formatViDate } from '../../lib/date'
import { getFastingScheme, upcomingFastingDays, upcomingHolidays } from '../../data/holidays'
import { describeDay, lunarLongLabel, relativeDayLabel } from './day-info'
import MoonPhase from './MoonPhase'

/** Dải "Hôm nay" ở đầu trang: ngày âm, trăng, ngày chay và ngày vía gần nhất. */
export default function TodayHero({ today, fasting, onSelectDate }) {
  const data = useMemo(() => {
    const date = fromKey(today)
    const info = describeDay(date, { fasting, today })
    // Bỏ ngày lễ trùng hôm nay vì đã hiển thị ngay phía trên
    const nextHoliday = upcomingHolidays(date, 3).find((h) => h.daysLeft > 0)
    const nextFasting = upcomingFastingDays(fasting, date, 2).find((d) => d.daysLeft > 0)
    return { info, nextHoliday, nextFasting }
  }, [today, fasting])

  const { info, nextHoliday, nextFasting } = data
  const scheme = getFastingScheme(fasting)

  return (
    <section
      aria-label="Hôm nay"
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-jade-800 via-jade-900 to-jade-950 p-5 text-white shadow-glow sm:p-7"
    >
      <div className="bg-lotus-pattern pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <div className="relative grid gap-6 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,18rem)] md:items-center">
        <div className="flex items-center gap-4 md:block">
          <MoonPhase lunarDay={info.lunar.day} className="h-20 w-20 animate-float sm:h-24 sm:w-24" />
          <div className="md:hidden">
            <p className="text-xs font-semibold tracking-widest text-jade-200 uppercase">Hôm nay</p>
            <p className="text-sm text-jade-100/90">{formatViDate(info.date)}</p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="hidden text-xs font-semibold tracking-widest text-jade-200 uppercase md:block">
            Hôm nay · {formatViDate(info.date)}
          </p>
          <p className="mt-1 font-serif text-2xl leading-snug font-semibold sm:text-3xl">{lunarLongLabel(info.lunar)}</p>
          <p className="mt-1 text-sm text-jade-100/85">
            Ngày {info.lunar.dayName} · tháng {info.lunar.monthName}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {info.holidays.map((h) => (
              <span
                key={h.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-saffron-300 px-3 py-1 text-xs font-semibold text-saffron-900"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {h.name}
              </span>
            ))}
            {info.fasting && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25 ring-inset">
                <Leaf className="h-3.5 w-3.5" aria-hidden />
                Hôm nay ăn chay ({scheme.label.split(' (')[0]})
              </span>
            )}
            {info.socVong && (
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20 ring-inset">
                {info.soc ? 'Ngày Sóc' : 'Ngày Vọng'}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
          {nextHoliday && (
            <button
              type="button"
              onClick={() => onSelectDate(nextHoliday.date)}
              className="group flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-left ring-1 ring-white/15 transition ring-inset hover:bg-white/15"
            >
              <Sparkles className="h-5 w-5 shrink-0 text-saffron-300" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{nextHoliday.short}</span>
                <span className="block text-xs text-jade-100/80">
                  {relativeDayLabel(nextHoliday.daysLeft)} · {formatShortDate(nextHoliday.date)}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5" aria-hidden />
            </button>
          )}
          {nextFasting && (
            <button
              type="button"
              onClick={() => onSelectDate(nextFasting.date)}
              className="group flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-left ring-1 ring-white/15 transition ring-inset hover:bg-white/15"
            >
              <Leaf className="h-5 w-5 shrink-0 text-jade-200" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">Ngày chay kế tiếp</span>
                <span className="block text-xs text-jade-100/80">
                  {relativeDayLabel(nextFasting.daysLeft)} · {formatShortDate(nextFasting.date)} ({nextFasting.lunar.day}/
                  {nextFasting.lunar.month} âm)
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
