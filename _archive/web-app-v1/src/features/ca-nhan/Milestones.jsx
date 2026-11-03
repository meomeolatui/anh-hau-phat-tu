import { useMemo } from 'react'
import { Award, Lock } from 'lucide-react'
import { formatNumber } from '../../lib/date'
import { milestones } from '../../lib/stats'
import { cn } from '../../lib/cn'
import Section from './Section'

/** Cột mốc tinh tấn — ghi nhận sự bền bỉ, không phải điểm số. */
export default function Milestones({ state }) {
  const items = useMemo(() => milestones(state), [state])
  const achieved = items.filter((m) => m.achieved).length

  return (
    <Section
      id="thanh-tuu"
      icon={Award}
      title="Cột mốc tinh tấn"
      description="Những dấu chân trên đường tu — để tự khích lệ, không để so bì."
      action={
        <span className="rounded-full bg-saffron-50 px-3 py-1 text-sm font-semibold text-saffron-800 dark:bg-saffron-900/30 dark:text-saffron-200">
          {achieved}/{items.length} cột mốc
        </span>
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <li
            key={m.id}
            className={cn(
              'relative flex gap-3 overflow-hidden rounded-2xl border p-4',
              m.achieved
                ? 'border-saffron-300 bg-gradient-to-br from-saffron-50 to-saffron-100/60 dark:border-saffron-700/60 dark:from-saffron-900/30 dark:to-night-2'
                : 'border-stone-200/70 bg-stone-50/60 dark:border-white/5 dark:bg-white/[0.02]',
            )}
          >
            <span
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                m.achieved
                  ? 'bg-saffron-500 text-white shadow-sm'
                  : 'bg-stone-200/70 text-stone-500 dark:bg-white/5 dark:text-stone-400',
              )}
            >
              {m.achieved ? <Award className="h-5 w-5" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('font-semibold', m.achieved ? 'text-saffron-900 dark:text-saffron-100' : 'text-stone-800 dark:text-stone-200')}>
                {m.title}
                {m.achieved && <span className="sr-only"> (đã đạt)</span>}
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-400">{m.desc}</p>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(m.progress * 100)}
                  aria-label={`Tiến độ ${m.title}`}
                >
                  <div
                    className={cn('h-full rounded-full transition-[width] duration-700', m.achieved ? 'bg-saffron-500' : 'bg-jade-500')}
                    style={{ width: `${m.progress * 100}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-stone-500 tabular-nums dark:text-stone-400">
                  {formatNumber(Math.min(m.value, m.target))}/{formatNumber(m.target)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
