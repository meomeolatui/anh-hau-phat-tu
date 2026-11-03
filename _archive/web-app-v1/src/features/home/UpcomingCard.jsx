import { ArrowRight, CalendarDays, Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card, { CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { formatShortDate, WEEKDAYS_SHORT_VI } from '../../lib/date'
import { cn } from '../../lib/cn'
import { countdownLabel } from './today'

/**
 * Ngày lễ – vía sắp tới và ngày chay sắp tới.
 * @param holidays [{ id, name, date, daysLeft, lunarLabel, kind }]
 * @param fastingDays [{ date, daysLeft, lunarLabel }]
 */
export default function UpcomingCard({ holidays, fastingDays, fastingLabel, fastingEnabled }) {
  return (
    <Card className="h-full">
      <CardTitle
        icon={CalendarDays}
        action={
          <Link to="/lich" className="inline-flex items-center gap-1 text-sm font-medium text-jade-700 hover:underline dark:text-jade-300">
            Xem lịch
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      >
        Ngày lễ sắp tới
      </CardTitle>

      {holidays.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">Chưa tính được ngày lễ sắp tới.</p>
      ) : (
        <ul className="space-y-3">
          {holidays.map((h) => (
            <li key={h.id} className="flex items-center gap-3">
              <div
                className={cn(
                  'grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-center leading-none',
                  h.kind === 'le'
                    ? 'bg-saffron-50 text-saffron-800 dark:bg-saffron-900/30 dark:text-saffron-200'
                    : 'bg-jade-50 text-jade-800 dark:bg-jade-900/40 dark:text-jade-200',
                )}
              >
                <span>
                  <span className="block text-[11px] font-medium">{WEEKDAYS_SHORT_VI[h.date.getDay()]}</span>
                  <span className="mt-1 block text-base font-semibold tabular-nums">{formatShortDate(h.date)}</span>
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-stone-800 dark:text-stone-100" title={h.name}>
                  {h.name}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400">{h.lunarLabel} âm lịch</p>
              </div>
              <Badge tone={h.daysLeft <= 7 ? 'saffron' : 'stone'} className="shrink-0">
                {countdownLabel(h.daysLeft)}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-stone-100 pt-4 dark:border-white/5">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-100">
          <Leaf className="h-4 w-4 text-jade-600 dark:text-jade-400" aria-hidden />
          Ngày chay sắp tới
          {fastingEnabled && <span className="font-normal text-stone-500 dark:text-stone-400">· {fastingLabel}</span>}
        </p>
        {!fastingEnabled ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Bạn chưa chọn lối ăn chay.{' '}
            <Link to="/ca-nhan#cai-dat" className="font-medium text-jade-700 underline-offset-2 hover:underline dark:text-jade-300">
              Chọn trong Cài đặt
            </Link>
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {fastingDays.map((f) => (
              <li
                key={f.date.toISOString()}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-sm',
                  f.daysLeft === 0
                    ? 'bg-jade-600 font-semibold text-white dark:bg-jade-500 dark:text-jade-950'
                    : 'bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300',
                )}
              >
                {f.daysLeft === 0 ? 'Hôm nay' : formatShortDate(f.date)}
                <span className="opacity-75"> · {f.lunarLabel} ÂL</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
