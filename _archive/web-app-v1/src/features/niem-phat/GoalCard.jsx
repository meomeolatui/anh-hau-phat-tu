import { Sparkles, Target } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ProgressRing from '../../components/ui/ProgressRing'
import { cn } from '../../lib/cn'
import { formatNumber } from '../../lib/date'

/** Tiến độ mục tiêu niệm Phật của hôm nay. */
export default function GoalCard({ today, goal, beadSize }) {
  const safeGoal = goal > 0 ? goal : 0
  const ratio = safeGoal ? today / safeGoal : 0
  const reached = safeGoal > 0 && today >= safeGoal
  const remaining = Math.max(0, safeGoal - today)
  const chains = Math.ceil(remaining / beadSize)

  return (
    <Card className={cn(reached && 'border-saffron-200 dark:border-saffron-800/60')}>
      <CardTitle
        icon={Target}
        action={
          <Button variant="ghost" size="sm" to="/ca-nhan">
            Đổi mục tiêu
          </Button>
        }
      >
        Mục tiêu hôm nay
      </CardTitle>
      <div className="flex items-center gap-5">
        <ProgressRing value={ratio} size={104} stroke={9} tone={reached ? 'saffron' : 'jade'} label="Tiến độ mục tiêu niệm Phật hôm nay">
          <span className="text-lg font-semibold text-stone-900 tabular-nums dark:text-stone-50">{Math.min(100, Math.round(ratio * 100))}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-2xl font-semibold text-stone-900 tabular-nums dark:text-stone-50">
            {formatNumber(today)}
            <span className="text-base font-normal text-stone-500 dark:text-stone-400"> / {safeGoal ? formatNumber(safeGoal) : '—'} câu</span>
          </p>
          {!safeGoal && <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Chưa đặt mục tiêu — vào Cá nhân để đặt nhé.</p>}
          {safeGoal > 0 && !reached && (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Còn {formatNumber(remaining)} câu, khoảng {chains} chuỗi {beadSize} hạt.
            </p>
          )}
          {reached && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-saffron-50 px-3 py-1 text-sm font-medium text-saffron-800 dark:bg-saffron-900/30 dark:text-saffron-200">
              <Sparkles className="h-4 w-4" aria-hidden />
              Đã tròn mục tiêu hôm nay
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
