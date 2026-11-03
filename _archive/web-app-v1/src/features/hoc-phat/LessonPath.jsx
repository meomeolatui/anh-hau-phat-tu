import { Link } from 'react-router-dom'
import { Check, ChevronRight, Clock, ListChecks, Trophy } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { cn } from '../../lib/cn'
import { formatPercent, lessonStatus, bestScore } from './learning'
import { levelStyle } from './lesson-icons'
import LessonIcon from './LessonIcon'

const STATUS_BADGE = {
  new: { tone: 'stone', label: 'Chưa học' },
  done: { tone: 'lotus', label: 'Đã học' },
  mastered: { tone: 'jade', label: 'Thuần thục' },
}

/** Mốc trên lộ trình: số thứ tự khi chưa học, dấu tích khi đã học. */
function PathNode({ number, status, isNext, level }) {
  const style = levelStyle(level)
  return (
    <span
      className={cn(
        'relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ring-4 ring-paper dark:ring-night',
        status === 'new' && !isNext && 'border-2 border-stone-300 bg-white text-stone-500 dark:border-white/15 dark:bg-night-2 dark:text-stone-400',
        status === 'new' && isNext && cn('bg-gradient-to-br text-white shadow-glow', style.tile),
        status !== 'new' && 'bg-jade-600 text-white dark:bg-jade-500 dark:text-jade-950',
      )}
      aria-hidden
    >
      {isNext && status === 'new' && <span className="absolute inset-0 animate-ping rounded-full bg-jade-400/30 motion-reduce:hidden" />}
      {status === 'new' ? number : <Check className="h-5 w-5" strokeWidth={3} />}
    </span>
  )
}

function LessonCard({ lesson, number, status, best, isNext }) {
  const style = levelStyle(lesson.level)
  const badge = STATUS_BADGE[status]
  return (
    <Link
      to={`/hoc-phat/${lesson.id}`}
      className={cn(
        'group flex flex-1 items-center gap-4 rounded-3xl border bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-jade-300 hover:shadow-glow sm:p-5 dark:bg-night-2 dark:hover:border-jade-700',
        isNext ? 'border-jade-300 ring-2 ring-jade-200 dark:border-jade-700 dark:ring-jade-900' : 'border-stone-200/70 dark:border-white/5',
      )}
    >
      <div className={cn('hidden h-12 w-12 shrink-0 place-items-center rounded-2xl sm:grid', style.soft)}>
        <LessonIcon name={lesson.icon} className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">Bài {number}</span>
          <Badge tone={badge.tone}>{badge.label}</Badge>
          {isNext && <Badge tone="saffron">Nên học tiếp</Badge>}
        </div>
        <h3 className="mt-1 font-serif text-lg leading-snug font-semibold text-stone-900 group-hover:text-jade-800 dark:text-stone-50 dark:group-hover:text-jade-200">
          {lesson.title}
        </h3>
        <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{lesson.subtitle}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />~{lesson.minutes} phút đọc
          </span>
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            {lesson.quiz.length} câu hỏi
          </span>
          {best !== null && (
            <span className="inline-flex items-center gap-1 font-medium text-saffron-700 dark:text-saffron-300">
              <Trophy className="h-3.5 w-3.5" aria-hidden />
              Cao nhất {formatPercent(best)}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-jade-600 dark:text-stone-600" aria-hidden />
    </Link>
  )
}

/**
 * Lộ trình theo cấp độ: mỗi cấp là một chặng, các bài nối nhau bằng đường dọc.
 * `numbers` ánh xạ id → số thứ tự trong toàn lộ trình (giữ nguyên khi lọc).
 */
export default function LessonPath({ levels, lessons, completed, numbers, nextId }) {
  return (
    <div className="space-y-10">
      {levels.map((level, li) => {
        const items = lessons.filter((l) => l.level === level.id)
        if (!items.length) return null
        const style = levelStyle(level.id)
        const done = items.filter((l) => lessonStatus(completed, l.id) !== 'new').length
        return (
          <section key={level.id} aria-labelledby={`chang-${level.id}`}>
            <header className="mb-4 flex items-start gap-3">
              <span className={cn('mt-0.5 rounded-xl px-2.5 py-1 text-xs font-bold tracking-wider uppercase', style.soft)}>Chặng {li + 1}</span>
              <div className="min-w-0 flex-1">
                <h2 id={`chang-${level.id}`} className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-50">
                  {level.label}
                  <span className="ml-2 align-middle font-sans text-sm font-normal text-stone-500 dark:text-stone-400">
                    {done}/{items.length} bài
                  </span>
                </h2>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{level.description}</p>
              </div>
            </header>
            <ol className="relative space-y-3 before:absolute before:top-4 before:bottom-4 before:left-[21px] before:w-0.5 before:rounded-full before:bg-stone-200 dark:before:bg-white/10">
              {items.map((lesson) => {
                const status = lessonStatus(completed, lesson.id)
                return (
                  <li key={lesson.id} className="flex items-center gap-3 sm:gap-4">
                    <PathNode number={numbers[lesson.id]} status={status} isNext={lesson.id === nextId} level={lesson.level} />
                    <LessonCard
                      lesson={lesson}
                      number={numbers[lesson.id]}
                      status={status}
                      best={bestScore(completed, lesson.id)}
                      isNext={lesson.id === nextId}
                    />
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
