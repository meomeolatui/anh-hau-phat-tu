import { BookOpen, CalendarCheck, CircleDot, HandHeart, Timer } from 'lucide-react'
import Stat from '../../components/ui/Stat'
import LotusEmblem from '../home/LotusEmblem'
import { diffDays, formatNumber, formatShortDate, todayKey, toKey } from '../../lib/date'

/** Thẻ đầu trang: danh tính + tổng kết hành trì từ trước tới nay. */
export default function ProfileOverview({ profile, totals, streak }) {
  const displayName = profile.name.trim() || profile.phapDanh.trim()
  const initial = displayName ? displayName.trim().split(/\s+/).pop()[0].toUpperCase() : ''
  const start = profile.createdAt ? new Date(profile.createdAt) : null
  const days = start ? diffDays(toKey(start), todayKey()) + 1 : 0

  const stats = [
    { icon: CircleDot, label: 'câu niệm Phật', value: formatNumber(totals.niem), tone: 'jade' },
    { icon: Timer, label: 'phút thiền', value: formatNumber(totals.thienMin), tone: 'lotus' },
    { icon: BookOpen, label: 'thời kinh', value: formatNumber(totals.tung), tone: 'saffron' },
    { icon: HandHeart, label: 'việc lành', value: formatNumber(totals.thienHanh), tone: 'lotus' },
    { icon: CalendarCheck, label: 'ngày tu tập', value: formatNumber(totals.activeDays), tone: 'jade' },
  ]

  return (
    <section aria-labelledby="overview-title" className="overflow-hidden rounded-4xl border border-stone-200/70 bg-white shadow-soft dark:border-white/5 dark:bg-night-2">
      <div className="bg-lotus-pattern relative h-24 bg-gradient-to-r from-jade-700 via-jade-800 to-jade-950 sm:h-28 dark:from-jade-900 dark:via-night-3 dark:to-night" aria-hidden />
      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-10 flex flex-wrap items-end gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lotus-300 to-lotus-600 font-serif text-3xl font-semibold text-white shadow-lg ring-4 ring-white dark:ring-night-2">
            {initial || <LotusEmblem className="h-12 w-12" />}
          </div>
          <div className="min-w-0 pb-1">
            <h2 id="overview-title" className="truncate font-serif text-2xl font-semibold text-stone-900 dark:text-stone-50">
              {displayName || 'Phật tử'}
            </h2>
            {profile.name.trim() && profile.phapDanh.trim() && (
              <p className="text-sm text-stone-600 dark:text-stone-400">Pháp danh {profile.phapDanh.trim()}</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
          {start
            ? `Đồng hành từ ${formatShortDate(start, true)} · ${formatNumber(days)} ngày · chuỗi hiện tại ${streak} ngày`
            : 'Chưa bắt đầu hành trình cùng ứng dụng.'}
        </p>

        <h3 className="mt-6 mb-3 text-sm font-semibold text-stone-800 dark:text-stone-200">Tổng kết hành trì</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <li key={s.label}>
              <Stat icon={s.icon} label={s.label} value={s.value} tone={s.tone} className="h-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
