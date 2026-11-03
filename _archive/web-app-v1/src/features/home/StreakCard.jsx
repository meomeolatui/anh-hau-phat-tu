import { Check, Flame } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import { cn } from '../../lib/cn'

/** Chuỗi ngày tinh tấn + dải 7 ngày gần nhất. */
export default function StreakCard({ current, longest, days }) {
  const activeCount = days.filter((d) => d.active).length
  return (
    <Card className="h-full">
      <CardTitle icon={Flame}>Chuỗi ngày tinh tấn</CardTitle>

      <div className="flex items-end gap-6">
        <div>
          <p className="font-serif text-5xl leading-none font-semibold text-jade-700 tabular-nums dark:text-jade-300">{current}</p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">ngày liên tiếp</p>
        </div>
        <div className="border-l border-stone-200 pl-6 dark:border-white/10">
          <p className="text-xl font-semibold text-stone-800 tabular-nums dark:text-stone-100">{longest}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">dài nhất</p>
        </div>
      </div>

      <ol className="mt-6 grid grid-cols-7 gap-1.5" aria-label={`7 ngày gần nhất: ${activeCount} ngày có tu tập`}>
        {days.map((d) => (
          <li key={d.key} className="flex flex-col items-center gap-1.5">
            <span className={cn('text-[11px] font-medium', d.isToday ? 'text-jade-700 dark:text-jade-300' : 'text-stone-500 dark:text-stone-400')}>
              {d.isToday ? 'Nay' : d.weekday}
            </span>
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full text-xs font-semibold transition',
                d.active
                  ? 'bg-jade-600 text-white shadow-sm dark:bg-jade-500 dark:text-jade-950'
                  : 'bg-stone-100 text-stone-500 dark:bg-white/5 dark:text-stone-400',
                d.isToday && !d.active && 'ring-2 ring-jade-400 ring-offset-2 ring-offset-white dark:ring-offset-night-2',
              )}
            >
              {d.active ? <Check className="h-4 w-4" aria-hidden /> : d.dayOfMonth}
              <span className="sr-only">
                {`ngày ${d.dayOfMonth}: ${d.active ? 'có tu tập' : 'chưa tu tập'}`}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-sm text-stone-600 dark:text-stone-400">
        {current === 0
          ? 'Hôm nay là ngày tốt để bắt đầu lại — chỉ cần một câu niệm Phật hay một việc lành.'
          : 'Không cần nhiều, chỉ cần mỗi ngày đều có một chút thực hành.'}
      </p>
    </Card>
  )
}
