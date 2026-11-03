import { useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AArrowDown, AArrowUp, ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Clock, ListChecks, Trophy } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useStore } from '../lib/store'
import { updateSettings } from '../lib/actions'
import { cn } from '../lib/cn'
import { LESSONS, getLesson, getLevel } from '../data/lessons'
import { FONT_MAX, FONT_MIN, adjacentLessons, bestScore, formatPercent, stepFontSize } from '../features/hoc-phat/learning'
import { getLessonIcon, levelStyle } from '../features/hoc-phat/lesson-icons'
import useReadingProgress from '../features/hoc-phat/useReadingProgress'
import { TocInline, TocSidebar } from '../features/hoc-phat/LessonToc'
import { KeyPoints, LessonSections } from '../features/hoc-phat/LessonContent'
import Quiz from '../features/hoc-phat/Quiz'
import StudyNote from '../features/hoc-phat/StudyNote'

const KEY_POINTS_ID = 'diem-cot-loi'
const QUIZ_ID = 'trac-nghiem'

function NotFoundLesson() {
  return (
    <>
      <PageHeader title="Bài học" icon={BookOpen} />
      <EmptyState
        icon={BookOpen}
        title="Không tìm thấy bài học"
        description="Bài học này có thể đã đổi tên hoặc không tồn tại. Hãy chọn một bài trong lộ trình."
        action={
          <Button to="/hoc-phat">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Về lộ trình Học Phật
          </Button>
        }
      />
    </>
  )
}

/** Thanh tiến độ đọc mảnh ở mép trên màn hình. */
function ReadingBar({ progress }) {
  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
      role="progressbar"
      aria-label="Tiến độ đọc bài"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-jade-500 via-jade-400 to-lotus-400 transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}

function FontControls({ size }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-stone-200 bg-white p-1 dark:border-white/10 dark:bg-night-2" role="group" aria-label="Cỡ chữ">
      <Button variant="ghost" size="icon" onClick={() => updateSettings({ readerFontSize: stepFontSize(size, -1) })} disabled={size <= FONT_MIN} aria-label="Giảm cỡ chữ">
        <AArrowDown className="h-5 w-5" aria-hidden />
      </Button>
      <span className="w-9 text-center text-sm tabular-nums text-stone-600 dark:text-stone-300" aria-live="polite">
        {size}
      </span>
      <Button variant="ghost" size="icon" onClick={() => updateSettings({ readerFontSize: stepFontSize(size, 1) })} disabled={size >= FONT_MAX} aria-label="Tăng cỡ chữ">
        <AArrowUp className="h-5 w-5" aria-hidden />
      </Button>
    </div>
  )
}

function NeighborLink({ lesson, dir }) {
  if (!lesson) return <div className="hidden sm:block" />
  const isPrev = dir === 'prev'
  const Chevron = isPrev ? ChevronLeft : ChevronRight
  return (
    <Link
      to={`/hoc-phat/${lesson.id}`}
      className={cn(
        'group flex items-center gap-3 rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft transition hover:border-jade-300 hover:shadow-glow sm:p-5 dark:border-white/5 dark:bg-night-2 dark:hover:border-jade-700',
        !isPrev && 'flex-row-reverse text-right',
      )}
    >
      <Chevron className="h-6 w-6 shrink-0 text-stone-400 transition group-hover:text-jade-600" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{isPrev ? 'Bài trước' : 'Bài tiếp theo'}</p>
        <p className="mt-0.5 font-serif font-semibold text-stone-900 group-hover:text-jade-800 dark:text-stone-50 dark:group-hover:text-jade-200">{lesson.title}</p>
      </div>
    </Link>
  )
}

function LessonView({ lesson }) {
  const articleRef = useRef(null)
  const fontRaw = useStore((s) => s.settings.readerFontSize)
  const completed = useStore((s) => s.lessons.completed)
  const fontSize = stepFontSize(fontRaw, 0)
  const best = bestScore(completed, lesson.id)
  const level = getLevel(lesson.level)
  const style = levelStyle(lesson.level)
  const Icon = getLessonIcon(lesson.icon)
  const { prev, next, index } = adjacentLessons(LESSONS, lesson.id)

  const tocItems = useMemo(
    () => [
      ...lesson.sections.map((s, i) => ({ id: `phan-${i + 1}`, label: s.heading, marker: i + 1 })),
      { id: KEY_POINTS_ID, label: 'Điểm cốt lõi', marker: '★' },
      { id: QUIZ_ID, label: 'Trắc nghiệm ôn tập', marker: '?' },
    ],
    [lesson],
  )
  const ids = useMemo(() => tocItems.map((t) => t.id), [tocItems])
  const { progress, active } = useReadingProgress(articleRef, ids)

  return (
    <div className="animate-fade-up">
      <ReadingBar progress={progress} />

      <Link
        to="/hoc-phat"
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-stone-600 hover:text-jade-700 dark:text-stone-400 dark:hover:text-jade-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Lộ trình Học Phật
      </Link>

      <PageHeader
        eyebrow={`Bài ${index + 1}/${LESSONS.length} · ${level?.label ?? ''}`}
        title={lesson.title}
        subtitle={lesson.subtitle}
        icon={Icon}
        actions={<FontControls size={fontSize} />}
      />

      <div className="-mt-2 mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={style.tone}>{level?.label}</Badge>
        <Badge tone="stone">
          <Clock className="h-3.5 w-3.5" aria-hidden />~{lesson.minutes} phút đọc
        </Badge>
        <Badge tone="stone">
          <ListChecks className="h-3.5 w-3.5" aria-hidden />
          {lesson.quiz.length} câu hỏi
        </Badge>
        {best !== null && (
          <Badge tone="saffron">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            Điểm cao nhất {formatPercent(best)}
          </Badge>
        )}
        <a
          href={`#${QUIZ_ID}`}
          className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-jade-700 hover:underline dark:text-jade-300"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(QUIZ_ID)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
          }}
        >
          Tới phần trắc nghiệm
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <TocInline items={tocItems} active={active} />
          <article ref={articleRef} aria-label={lesson.title} className="space-y-6">
            <LessonSections sections={lesson.sections} fontSize={fontSize} />
            <KeyPoints points={lesson.keyPoints} id={KEY_POINTS_ID} />
            <Quiz key={lesson.id} id={QUIZ_ID} lesson={lesson} nextLesson={next} />
          </article>

          <StudyNote className="mt-6" />

          <nav aria-label="Chuyển bài" className="mt-6 grid gap-3 sm:grid-cols-2">
            <NeighborLink lesson={prev} dir="prev" />
            <NeighborLink lesson={next} dir="next" />
          </nav>
        </div>

        <aside className="hidden lg:block">
          <TocSidebar items={tocItems} active={active} progress={progress} />
        </aside>
      </div>
    </div>
  )
}

export default function HocPhatDetail() {
  const { id } = useParams()
  const lesson = id ? getLesson(id) : null
  if (!lesson) return <NotFoundLesson />
  return <LessonView key={lesson.id} lesson={lesson} />
}
