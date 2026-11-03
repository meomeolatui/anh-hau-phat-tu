import { ArrowRight, BookOpen, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card, { CardTitle } from '../../components/ui/Card'
import ProgressRing from '../../components/ui/ProgressRing'
import { formatNumber } from '../../lib/date'
import { dayProgress } from '../../lib/stats'

/**
 * Thời khoá hôm nay: 3 vòng tiến độ theo mục tiêu cá nhân.
 */
export default function TodayPractice({ day, goals }) {
  const p = dayProgress(day, goals)
  const deeds = day.thienHanh?.length ?? 0
  const items = [
    {
      id: 'niem',
      label: 'Niệm Phật',
      tone: 'jade',
      value: p.niem,
      done: day.niem,
      goal: goals.niem,
      unit: 'câu',
      to: '/niem-phat',
      cta: 'Niệm tiếp',
    },
    {
      id: 'thien',
      label: 'Thiền định',
      tone: 'lotus',
      value: p.thien,
      done: day.thienMin,
      goal: goals.thienMin,
      unit: 'phút',
      to: '/thien',
      cta: 'Ngồi thiền',
    },
    {
      id: 'thienHanh',
      label: 'Thiện hạnh',
      tone: 'saffron',
      value: p.thienHanh,
      done: deeds,
      goal: goals.thienHanh,
      unit: 'việc',
      to: '/nhat-ky',
      cta: 'Ghi việc lành',
    },
  ]
  const overall = (p.niem + p.thien + p.thienHanh) / 3
  const complete = overall >= 1

  return (
    <Card className="h-full">
      <CardTitle
        icon={Target}
        action={
          <span className="text-sm font-medium text-stone-500 tabular-nums dark:text-stone-400">
            {Math.round(overall * 100)}% hoàn thành
          </span>
        }
      >
        Thời khoá hôm nay
      </CardTitle>

      <ul className="grid grid-cols-3 gap-2 sm:gap-4">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col items-center text-center">
            <ProgressRing
              value={it.value}
              size={96}
              stroke={9}
              tone={it.tone}
              label={`${it.label}: ${formatNumber(it.done)} trên ${formatNumber(it.goal)} ${it.unit}`}
            >
              <RingValue done={it.done} goal={it.goal} />
            </ProgressRing>
            <p className="mt-2 text-sm font-semibold text-stone-800 dark:text-stone-100">{it.label}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">mục tiêu {formatNumber(it.goal)} {it.unit}</p>
            <Link
              to={it.to}
              className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-jade-700 transition hover:bg-jade-50 dark:text-jade-300 dark:hover:bg-jade-900/40"
            >
              {it.cta}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-4 text-sm dark:border-white/5">
        {complete ? (
          <p className="flex items-center gap-2 font-medium text-saffron-700 dark:text-saffron-300">
            <Sparkles className="h-4 w-4" aria-hidden />
            Bạn đã tròn thời khoá hôm nay. Tuỳ hỷ!
          </p>
        ) : (
          <p className="text-stone-600 dark:text-stone-400">Từng chút một, đều đặn quý hơn nhiều.</p>
        )}
        <p className="ml-auto flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
          <BookOpen className="h-4 w-4" aria-hidden />
          {day.tung > 0 ? `Đã tụng ${day.tung} thời kinh` : 'Chưa tụng kinh'}
        </p>
      </div>
    </Card>
  )
}

function RingValue({ done, goal }) {
  return (
    <span className="leading-tight">
      <span className="block text-lg font-semibold text-stone-900 tabular-nums dark:text-stone-50">{formatNumber(done)}</span>
      <span className="block text-[11px] text-stone-500 tabular-nums dark:text-stone-400">/ {formatNumber(goal)}</span>
    </span>
  )
}
