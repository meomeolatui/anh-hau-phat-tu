import { useMemo } from 'react'
import { CalendarCheck, ChartColumn, Clock, Hourglass, Timer } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ProgressRing from '../../components/ui/ProgressRing'
import { useStore } from '../../lib/store'
import { getDay } from '../../lib/actions'
import { series, totals } from '../../lib/stats'
import { diffDays, formatShortDate, formatTime, todayKey, toKey } from '../../lib/date'
import { humanDuration, recentThienSessions, weekSummary } from './summary'
import WeekChart from './WeekChart'

/** Hôm nay so với mục tiêu + biểu đồ 7 ngày. */
export function TodayCard() {
  const logs = useStore((s) => s.logs)
  const goal = useStore((s) => s.profile.goals.thienMin)
  const key = todayKey()
  const todayMin = getDay(logs, key).thienMin
  const points = useMemo(() => series(logs, 'thienMin', 7, key), [logs, key])
  const week = useMemo(() => weekSummary(points), [points])
  const allMin = useMemo(() => totals(logs).thienMin, [logs])
  const ratio = goal ? todayMin / goal : 0
  const reached = goal > 0 && todayMin >= goal

  return (
    <Card>
      <CardTitle icon={Timer}>Hôm nay</CardTitle>
      <div className="flex items-center gap-5">
        <ProgressRing value={ratio} size={112} stroke={10} tone={reached ? 'saffron' : 'jade'} label="Tiến độ mục tiêu thiền hôm nay">
          <div>
            <p className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">{todayMin}</p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">/ {goal} phút</p>
          </div>
        </ProgressRing>
        <div className="min-w-0 space-y-1">
          <p className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-50">
            {reached ? 'Đã đủ mục tiêu' : todayMin > 0 ? `Còn ${Math.max(0, goal - todayMin)} phút` : 'Chưa ngồi hôm nay'}
          </p>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {reached
              ? 'Thời gian tĩnh lặng hôm nay đã trọn. Mang sự bình an ấy vào đời sống nhé.'
              : 'Chỉ vài phút ngồi yên cũng đủ để tâm lắng lại.'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Phút tuần này', value: week.total },
          { label: 'Ngày có ngồi', value: `${week.activeDays}/7` },
          { label: 'Tổng phút', value: allMin },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-stone-50 px-2 py-3 dark:bg-white/5">
            <p className="text-lg font-semibold tabular-nums text-stone-900 dark:text-stone-50">{s.value}</p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
          <ChartColumn className="h-4 w-4 text-jade-600 dark:text-jade-400" aria-hidden />
          Phút thiền 7 ngày
        </h3>
        <WeekChart points={points} goal={goal} todayKey={key} />
      </div>
    </Card>
  )
}

/** Lịch sử các buổi ngồi gần đây. */
export function RecentSessions() {
  const sessions = useStore((s) => s.sessions)
  const recent = useMemo(() => recentThienSessions(sessions, 6), [sessions])
  const today = todayKey()
  const thisYear = Number(today.slice(0, 4))

  return (
    <Card>
      <CardTitle icon={Clock}>Buổi ngồi gần đây</CardTitle>
      {recent.length === 0 ? (
        <EmptyState icon={Hourglass} title="Chưa có buổi ngồi nào" description="Buổi ngồi đầu tiên từ 1 phút trở lên sẽ hiện ở đây." />
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-white/5">
          {recent.map((s) => {
            const at = new Date(s.at)
            const ago = diffDays(toKey(at), today)
            const dayLabel = ago === 0 ? 'Hôm nay' : ago === 1 ? 'Hôm qua' : formatShortDate(at, at.getFullYear() !== thisYear)
            return (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-jade-50 text-jade-700 dark:bg-jade-900/40 dark:text-jade-300">
                  <CalendarCheck className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900 dark:text-stone-100">{humanDuration(s.duration)}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {dayLabel} · {formatTime(at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
