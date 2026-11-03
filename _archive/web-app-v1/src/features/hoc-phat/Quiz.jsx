import { useEffect, useId, useReducer, useRef, useState } from 'react'
import { ArrowRight, CircleCheck, CircleX, Keyboard, ListChecks, Play, RotateCcw, Trophy } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ProgressRing from '../../components/ui/ProgressRing'
import { useToast } from '../../components/ui/toast-context'
import { completeLesson } from '../../lib/actions'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/cn'
import { bestScore, formatPercent } from './learning'
import { INITIAL_QUIZ, gradeQuiz, keyToOptionIndex, quizReducer, scoreMessage } from './quiz-engine'

const OPTION_KEYS = ['1', '2', '3', '4']

function optionClass({ revealed, isAnswer, isChosen }) {
  if (!revealed) {
    return 'border-stone-200 bg-white hover:border-jade-400 hover:bg-jade-50/60 dark:border-white/10 dark:bg-night-3/40 dark:hover:border-jade-600 dark:hover:bg-jade-900/30'
  }
  if (isAnswer) return 'border-jade-500 bg-jade-50 text-jade-900 dark:border-jade-500 dark:bg-jade-900/40 dark:text-jade-50'
  if (isChosen) return 'border-lotus-400 bg-lotus-50 text-lotus-900 dark:border-lotus-500 dark:bg-lotus-900/30 dark:text-lotus-50'
  return 'border-stone-200 bg-white opacity-60 dark:border-white/10 dark:bg-transparent'
}

/** Thanh tiến độ dạng từng đốt: xanh = đúng, hồng = chưa đúng, viền = câu hiện tại. */
function QuizSteps({ quiz, answers, index }) {
  return (
    <ol className="flex gap-1.5" aria-hidden>
      {quiz.map((item, i) => {
        const answered = answers[i] !== undefined
        return (
          <li
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              answered && answers[i] === item.answer && 'bg-jade-500',
              answered && answers[i] !== item.answer && 'bg-lotus-400',
              !answered && i === index && 'bg-jade-200 dark:bg-jade-800',
              !answered && i !== index && 'bg-stone-200 dark:bg-white/10',
            )}
          />
        )
      })}
    </ol>
  )
}

function QuizIntro({ count, best, onStart }) {
  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-stone-700 dark:text-stone-300">
          {count} câu hỏi ngắn giúp bạn ôn lại những điểm chính. Mỗi câu chọn một đáp án và đọc phần giải thích.
        </p>
        {best !== null && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-saffron-700 dark:text-saffron-300">
            <Trophy className="h-4 w-4" aria-hidden />
            Điểm cao nhất của bạn: {formatPercent(best)}
          </p>
        )}
      </div>
      <Button size="lg" onClick={onStart}>
        <Play className="h-5 w-5" aria-hidden />
        {best === null ? 'Bắt đầu làm bài' : 'Làm lại bài'}
      </Button>
    </div>
  )
}

function QuizResult({ quiz, answers, best, nextLesson, onRestart, headingRef }) {
  const { correct, total, score } = gradeQuiz(quiz, answers)
  const msg = scoreMessage(score)
  return (
    <div className="animate-fade-up">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <ProgressRing value={score} size={128} stroke={11} tone={score >= 0.8 ? 'jade' : 'saffron'} label={`Kết quả ${formatPercent(score)}`}>
          <div>
            <p className="text-3xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
              {correct}/{total}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">câu đúng</p>
          </div>
        </ProgressRing>
        <div>
          <h3 ref={headingRef} tabIndex={-1} className="font-serif text-2xl font-semibold text-stone-900 outline-none dark:text-stone-50">
            {msg.title}
          </h3>
          <p className="mt-1 max-w-md text-stone-600 dark:text-stone-300">{msg.text}</p>
          {best !== null && (
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Điểm lần này {formatPercent(score)} · Điểm cao nhất {formatPercent(best)}
            </p>
          )}
        </div>
      </div>

      <details className="group mt-6 rounded-2xl border border-stone-200 dark:border-white/10">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium text-stone-800 dark:text-stone-200">
          <ListChecks className="h-5 w-5 text-jade-600 dark:text-jade-400" aria-hidden />
          Xem lại đáp án
          <span className="ml-auto text-sm text-stone-500 group-open:hidden">Mở</span>
          <span className="ml-auto hidden text-sm text-stone-500 group-open:inline">Thu gọn</span>
        </summary>
        <ol className="space-y-4 border-t border-stone-200 px-4 py-4 dark:border-white/10">
          {quiz.map((item, i) => {
            const ok = answers[i] === item.answer
            const Icon = ok ? CircleCheck : CircleX
            return (
              <li key={i} className="flex gap-3">
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ok ? 'text-jade-600 dark:text-jade-400' : 'text-lotus-600 dark:text-lotus-400')} aria-label={ok ? 'Đúng' : 'Chưa đúng'} />
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-stone-900 dark:text-stone-100">{item.q}</p>
                  {!ok && <p className="mt-1 text-lotus-700 dark:text-lotus-300">Bạn chọn: {item.options[answers[i]] ?? '—'}</p>}
                  <p className="mt-1 text-jade-800 dark:text-jade-200">Đáp án: {item.options[item.answer]}</p>
                  <p className="mt-1 text-stone-600 dark:text-stone-400">{item.explain}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </details>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" size="lg" onClick={onRestart}>
          <RotateCcw className="h-5 w-5" aria-hidden />
          Làm lại
        </Button>
        {nextLesson ? (
          <Button size="lg" to={`/hoc-phat/${nextLesson.id}`}>
            Bài tiếp theo
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        ) : (
          <Button size="lg" to="/hoc-phat">
            Về lộ trình học
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Trắc nghiệm từng câu một. Bàn phím: 1–4 chọn đáp án, → hoặc Enter (trên nút) để sang câu.
 * Hoàn thành → lưu điểm (giữ điểm cao nhất) qua completeLesson.
 * Nơi dùng nên đặt key={lesson.id} để trạng thái làm bài tự reset khi chuyển bài.
 */
export default function Quiz({ lesson, nextLesson, id }) {
  const { quiz } = lesson
  const total = quiz.length
  const toast = useToast()
  const completed = useStore((s) => s.lessons.completed)
  const best = bestScore(completed, lesson.id)
  const [started, setStarted] = useState(false)
  const [state, dispatch] = useReducer(quizReducer, INITIAL_QUIZ)
  const questionRef = useRef(null)
  const nextRef = useRef(null)
  const resultRef = useRef(null)
  const qId = useId()

  // Đưa tiêu điểm tới đúng chỗ để người dùng bàn phím / trình đọc màn hình theo kịp.
  useEffect(() => {
    if (!started) return
    if (state.done) resultRef.current?.focus()
    else if (state.revealed) nextRef.current?.focus()
    else questionRef.current?.focus()
  }, [started, state.done, state.revealed, state.index])

  const item = quiz[state.index]
  const chosen = state.answers[state.index]

  const select = (choice) => dispatch({ type: 'select', choice, total })

  const goNext = () => {
    if (!state.revealed) return
    if (state.index >= total - 1) {
      const { correct, score } = gradeQuiz(quiz, state.answers)
      completeLesson(lesson.id, score)
      toast({
        title: 'Đã hoàn thành bài học',
        description: `${lesson.title}: đúng ${correct}/${total} câu (${formatPercent(score)}).`,
        tone: score >= 0.5 ? 'success' : 'info',
      })
    }
    dispatch({ type: 'next', total })
  }

  const restart = () => {
    dispatch({ type: 'restart' })
    setStarted(true)
  }

  const onKeyDown = (e) => {
    if (!started || state.done || e.altKey || e.ctrlKey || e.metaKey) return
    const idx = keyToOptionIndex(e.key, item.options.length)
    if (idx >= 0 && !state.revealed) {
      e.preventDefault()
      select(idx)
      return
    }
    if (e.key === 'ArrowRight' && state.revealed) {
      e.preventDefault()
      goNext()
    }
  }

  if (!total) return null

  return (
    <Card id={id} as="section" aria-labelledby={`${qId}-title`} className="scroll-mt-24 overflow-hidden lg:scroll-mt-8" onKeyDown={onKeyDown}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={`${qId}-title`} className="flex items-center gap-2 font-serif text-xl font-semibold text-stone-900 dark:text-stone-50">
          <ListChecks className="h-6 w-6 text-jade-600 dark:text-jade-400" aria-hidden />
          Trắc nghiệm ôn tập
        </h2>
        {started && !state.done && (
          <span className="text-sm font-medium tabular-nums text-stone-500 dark:text-stone-400">
            Câu {state.index + 1}/{total}
          </span>
        )}
      </div>

      {!started && <QuizIntro count={total} best={best} onStart={() => setStarted(true)} />}

      {started && state.done && (
        <QuizResult quiz={quiz} answers={state.answers} best={best} nextLesson={nextLesson} onRestart={restart} headingRef={resultRef} />
      )}

      {started && !state.done && (
        <div key={state.index} className="animate-fade-up">
          <QuizSteps quiz={quiz} answers={state.answers} index={state.index} />
          <h3
            id={`${qId}-q`}
            ref={questionRef}
            tabIndex={-1}
            className="mt-5 font-serif text-lg leading-relaxed font-semibold text-stone-900 outline-none sm:text-xl dark:text-stone-50"
          >
            {item.q}
          </h3>

          <div role="group" aria-labelledby={`${qId}-q`} className="mt-4 grid gap-2.5">
            {item.options.map((opt, i) => {
              const isAnswer = i === item.answer
              const isChosen = i === chosen
              return (
                <button
                  key={i}
                  type="button"
                  disabled={state.revealed}
                  onClick={() => select(i)}
                  aria-label={`Đáp án ${i + 1}: ${opt}${state.revealed && isAnswer ? ' — đáp án đúng' : ''}${state.revealed && isChosen && !isAnswer ? ' — bạn đã chọn, chưa đúng' : ''}`}
                  className={cn(
                    'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base text-stone-800 transition disabled:cursor-default dark:text-stone-100',
                    optionClass({ revealed: state.revealed, isAnswer, isChosen }),
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-semibold',
                      state.revealed && isAnswer
                        ? 'bg-jade-600 text-white'
                        : state.revealed && isChosen
                          ? 'bg-lotus-500 text-white'
                          : 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300',
                    )}
                    aria-hidden
                  >
                    {OPTION_KEYS[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {state.revealed && isAnswer && <CircleCheck className="h-5 w-5 shrink-0 text-jade-600 dark:text-jade-400" aria-hidden />}
                  {state.revealed && isChosen && !isAnswer && <CircleX className="h-5 w-5 shrink-0 text-lotus-600 dark:text-lotus-400" aria-hidden />}
                </button>
              )
            })}
          </div>

          <div aria-live="polite">
            {state.revealed && (
              <div
                className={cn(
                  'mt-4 animate-fade-up rounded-2xl p-4',
                  chosen === item.answer ? 'bg-jade-50 dark:bg-jade-900/30' : 'bg-lotus-50 dark:bg-lotus-900/20',
                )}
              >
                <p className={cn('font-semibold', chosen === item.answer ? 'text-jade-800 dark:text-jade-200' : 'text-lotus-800 dark:text-lotus-200')}>
                  {chosen === item.answer ? 'Chính xác!' : `Chưa đúng — đáp án đúng là: ${item.options[item.answer]}`}
                </p>
                <p className="mt-1 text-stone-700 dark:text-stone-300">{item.explain}</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="hidden items-center gap-1.5 text-xs text-stone-500 sm:flex dark:text-stone-400">
              <Keyboard className="h-4 w-4" aria-hidden />
              Phím 1–4 để chọn · phím → để sang câu
            </p>
            <Button ref={nextRef} size="lg" onClick={goNext} disabled={!state.revealed} className="ml-auto">
              {state.index >= total - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
