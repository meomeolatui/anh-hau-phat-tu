import { ArrowRight, Award, Clock, Sparkles, Target } from 'lucide-react'
import Button from '../../components/ui/Button'
import ProgressRing from '../../components/ui/ProgressRing'
import { cn } from '../../lib/cn'
import { formatPercent } from './learning'
import { levelStyle } from './lesson-icons'
import LessonIcon from './LessonIcon'

const REASON = {
  start: { eyebrow: 'Bắt đầu hành trình', cta: 'Bắt đầu học' },
  continue: { eyebrow: 'Bài tiếp theo', cta: 'Học tiếp' },
  review: { eyebrow: 'Gợi ý ôn tập', cta: 'Ôn lại bài' },
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/70 text-jade-700 dark:bg-white/5 dark:text-jade-300">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-lg leading-tight font-semibold tabular-nums text-stone-900 dark:text-stone-50">{value}</p>
        <p className="text-xs text-stone-600 dark:text-stone-400">{label}</p>
      </div>
    </div>
  )
}

function NextUp({ suggestion }) {
  if (!suggestion) {
    return (
      <div className="flex h-full flex-col justify-center rounded-3xl bg-gradient-to-br from-saffron-400 to-saffron-600 p-5 text-white shadow-soft">
        <Sparkles className="h-7 w-7" aria-hidden />
        <p className="mt-3 font-serif text-lg font-semibold">Bạn đã thuần thục toàn bộ lộ trình</p>
        <p className="mt-1 text-sm text-white/90">Hãy đem những điều đã học vào từng lời nói, việc làm. Có thể ôn lại bất cứ bài nào khi cần.</p>
      </div>
    )
  }
  const { lesson, reason } = suggestion
  const meta = REASON[reason] ?? REASON.continue
  return (
    <div className="flex h-full flex-col rounded-3xl bg-gradient-to-br from-jade-700 to-jade-900 p-5 text-white shadow-glow">
      <p className="text-xs font-semibold tracking-widest text-jade-200 uppercase">{meta.eyebrow}</p>
      <div className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
          <LessonIcon name={lesson.icon} className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="font-serif text-lg leading-snug font-semibold">{lesson.title}</p>
          <p className="mt-0.5 text-sm text-jade-100/90">{lesson.subtitle}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="inline-flex items-center gap-1.5 text-sm text-jade-100">
          <Clock className="h-4 w-4" aria-hidden />~{lesson.minutes} phút
        </span>
        <Button to={`/hoc-phat/${lesson.id}`} className="bg-white text-jade-800 hover:bg-jade-50 dark:bg-white dark:text-jade-900 dark:hover:bg-jade-50">
          {meta.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

/** Khối tổng quan đầu trang: vòng tiến độ, số liệu, tiến độ theo cấp độ và gợi ý bài tiếp theo. */
export default function LearningOverview({ overall, levels, levelProgress, suggestion }) {
  return (
    <section aria-label="Tiến độ học" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="relative overflow-hidden rounded-4xl border border-jade-100 bg-gradient-to-br from-jade-50 via-white to-lotus-50 p-5 sm:p-6 dark:border-white/5 dark:from-night-2 dark:via-night-2 dark:to-jade-950">
        <div className="bg-lotus-pattern pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <ProgressRing value={overall.ratio} size={132} stroke={12} label={`Đã hoàn thành ${overall.done} trên ${overall.total} bài`} className="mx-auto sm:mx-0">
            <div>
              <p className="text-3xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
                {overall.done}
                <span className="text-lg text-stone-400">/{overall.total}</span>
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">bài đã học</p>
            </div>
          </ProgressRing>

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={Target} label="Điểm trung bình" value={overall.avgScore === null ? '—' : formatPercent(overall.avgScore)} />
              <MiniStat icon={Award} label="Bài thuần thục" value={overall.mastered} />
              <MiniStat icon={Clock} label="Phút còn lại" value={`~${overall.minutesLeft}`} />
            </div>

            <ul className="mt-5 space-y-2.5">
              {levels.map((level) => {
                const p = levelProgress.find((x) => x.level === level.id)
                if (!p) return null
                const style = levelStyle(level.id)
                return (
                  <li key={level.id} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-sm">
                    <span className="font-medium text-stone-700 dark:text-stone-300">{level.label}</span>
                    <span
                      className="h-2 overflow-hidden rounded-full bg-white/80 dark:bg-white/10"
                      role="progressbar"
                      aria-label={`Tiến độ cấp ${level.label}`}
                      aria-valuemin={0}
                      aria-valuemax={p.total}
                      aria-valuenow={p.done}
                    >
                      <span className={cn('block h-full rounded-full transition-[width] duration-700', style.bar)} style={{ width: `${p.ratio * 100}%` }} />
                    </span>
                    <span className="tabular-nums text-stone-500 dark:text-stone-400">
                      {p.done}/{p.total}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <NextUp suggestion={suggestion} />
    </section>
  )
}
