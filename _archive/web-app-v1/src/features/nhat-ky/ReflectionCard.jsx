import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Check, CornerDownLeft, Feather, LoaderCircle, RefreshCw } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import { REFLECTION_PROMPTS } from '../../data/good-deeds'
import { setDayNote } from '../../lib/actions'
import { pickPrompt } from './journal'

const MAX_LEN = 2000
export const SAVE_DELAY = 800

/**
 * Ghi chú / tự vấn trong ngày, tự lưu sau khi ngừng gõ (debounce).
 * Cha mẹ gắn key={dayKey} để khi đổi ngày component được dựng lại với nội dung của ngày mới.
 */
export default function ReflectionCard({ dayKey, note, isToday }) {
  const [text, setText] = useState(note ?? '')
  const [status, setStatus] = useState('idle')
  const [round, setRound] = useState(0)
  const pending = useRef(null)
  const fieldId = useId()
  const promptId = useId()
  const prompt = pickPrompt(REFLECTION_PROMPTS, dayKey, round)

  const flush = useCallback(() => {
    const p = pending.current
    if (!p) return
    clearTimeout(p.timer)
    pending.current = null
    setDayNote(p.value, dayKey)
    setStatus('saved')
  }, [dayKey])

  // Rời trang hoặc đổi ngày khi còn chữ chưa lưu → lưu ngay, không để mất
  useEffect(
    () => () => {
      const p = pending.current
      if (!p) return
      clearTimeout(p.timer)
      setDayNote(p.value, dayKey)
    },
    [dayKey],
  )

  const schedule = (value) => {
    setText(value)
    setStatus('pending')
    clearTimeout(pending.current?.timer)
    pending.current = { value, timer: setTimeout(flush, SAVE_DELAY) }
  }

  const insertPrompt = () => {
    const sep = text.trim() ? (text.endsWith('\n') ? '\n' : '\n\n') : ''
    schedule(`${text}${sep}${prompt}\n`.slice(0, MAX_LEN))
    requestAnimationFrame(() => {
      const el = document.getElementById(fieldId)
      if (!el) return
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    })
  }

  return (
    <Card>
      <CardTitle icon={Feather} action={<SaveStatus status={status} hasText={Boolean(text)} />}>
        {isToday ? 'Lắng lòng cuối ngày' : 'Ghi chép ngày ấy'}
      </CardTitle>

      <div className="rounded-2xl bg-lotus-50/70 p-4 dark:bg-lotus-900/15">
        <p className="text-xs font-semibold tracking-wide text-lotus-700 uppercase dark:text-lotus-300">Câu hỏi tự vấn</p>
        <p id={promptId} className="mt-1 font-serif text-[17px] leading-relaxed text-stone-800 dark:text-stone-100">
          {prompt}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRound((r) => r + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-lotus-700 hover:bg-lotus-100 dark:text-lotus-200 dark:hover:bg-lotus-900/30"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Câu khác
          </button>
          <button
            type="button"
            onClick={insertPrompt}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-lotus-700 hover:bg-lotus-100 dark:text-lotus-200 dark:hover:bg-lotus-900/30"
          >
            <CornerDownLeft className="h-4 w-4" aria-hidden />
            Chép vào ghi chú
          </button>
        </div>
      </div>

      <label htmlFor={fieldId} className="mt-4 mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
        Ghi chú của bạn
      </label>
      <textarea
        id={fieldId}
        value={text}
        onChange={(e) => schedule(e.target.value.slice(0, MAX_LEN))}
        onBlur={flush}
        maxLength={MAX_LEN}
        rows={6}
        aria-describedby={promptId}
        placeholder="Viết vài dòng thật lòng, chỉ mình bạn đọc…"
        className="min-h-36 w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 font-serif text-base leading-relaxed text-stone-900 placeholder:font-sans placeholder:text-stone-400 focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none dark:border-white/10 dark:bg-night-3 dark:text-stone-100"
      />
      <p className="mt-1 flex justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>Tự động lưu trên thiết bị này.</span>
        <span className="tabular-nums">
          {text.length}/{MAX_LEN}
        </span>
      </p>
    </Card>
  )
}

function SaveStatus({ status, hasText }) {
  return (
    <span role="status" className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
      {status === 'pending' && (
        <>
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Đang lưu…
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5 text-jade-600 dark:text-jade-400" aria-hidden />
          Đã lưu
        </>
      )}
      {status === 'idle' && hasText && 'Đã lưu'}
    </span>
  )
}
