import { useMemo, useState } from 'react'
import { CalendarDays, ChartColumn, Clock, CircleDot } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { useStore } from '../../lib/store'
import { series } from '../../lib/stats'
import { formatDuration, formatNumber, formatTime, todayKey } from '../../lib/date'
import { countNiemSessions, dayLabel, recentNiemSessions, weekSummary } from './chart'
import WeekChart from './WeekChart'

const PAGE = 5

/** Thống kê 7 ngày + danh sách phiên niệm gần đây. */
export default function NiemHistory({ todayCount }) {
  const logs = useStore((s) => s.logs)
  const sessions = useStore((s) => s.sessions)
  const goal = useStore((s) => s.profile.goals.niem)
  const [limit, setLimit] = useState(PAGE)
  const today = todayKey()

  // Cột hôm nay dùng số trực tiếp (gồm cả phần chưa kịp ghi) để biểu đồ khớp với bộ đếm
  const week = useMemo(() => {
    const data = series(logs, 'niem', 7, today)
    data[data.length - 1] = { ...data[data.length - 1], value: todayCount }
    return data
  }, [logs, today, todayCount])
  const summary = useMemo(() => weekSummary(week), [week])
  const recent = useMemo(() => recentNiemSessions(sessions, limit), [sessions, limit])
  const totalSessions = useMemo(() => countNiemSessions(sessions), [sessions])

  return (
    <Card>
      <CardTitle icon={ChartColumn}>Bảy ngày qua</CardTitle>
      <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Hôm nay', todayCount],
          ['Cả tuần', summary.total],
          ['TB ngày có niệm', summary.average],
        ].map(([label, value]) => (
          // Đảo thứ tự hiển thị để số nằm trên nhưng dt vẫn đứng trước dd trong mã (đúng ngữ nghĩa)
          <div key={label} className="flex flex-col-reverse rounded-2xl bg-paper-2 px-2 py-3 dark:bg-night-3">
            <dt className="text-xs text-stone-500 dark:text-stone-400">{label}</dt>
            <dd className="text-lg font-semibold text-stone-900 tabular-nums dark:text-stone-50">{formatNumber(value)}</dd>
          </div>
        ))}
      </dl>
      <WeekChart data={week} goal={goal} />
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        {summary.activeDays ? `Có niệm Phật ${summary.activeDays}/7 ngày.` : 'Tuần này chưa có số liệu — bắt đầu bằng vài câu thôi cũng quý.'}
      </p>

      <h3 className="mt-6 mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
        <Clock className="h-4 w-4 text-jade-600 dark:text-jade-400" aria-hidden />
        Phiên gần đây
      </h3>
      {recent.length === 0 ? (
        <EmptyState
          icon={CircleDot}
          title="Chưa có phiên nào"
          description="Khi niệm xong, bấm “Kết thúc phiên” để lưu lại thời gian và số câu."
          className="py-6"
        />
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-white/5">
          {recent.map((s) => {
            const at = new Date(s.at)
            return (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-jade-50 text-jade-700 dark:bg-jade-900/40 dark:text-jade-300">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">{s.ref || 'Niệm Phật'}</p>
                  <p className="text-xs text-stone-500 tabular-nums dark:text-stone-400">
                    {dayLabel(at, today)} · {formatTime(at)} · {formatDuration(s.duration)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-jade-800 tabular-nums dark:text-jade-200">{formatNumber(s.count)} câu</p>
              </li>
            )
          })}
        </ul>
      )}
      {totalSessions > recent.length && (
        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setLimit((n) => n + PAGE * 2)}>
          Xem thêm phiên cũ
        </Button>
      )}
    </Card>
  )
}
