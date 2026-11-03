import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Heart, ImageDown, NotebookPen, Shuffle, X } from 'lucide-react'
import { useToast } from '../../components/ui/toast-context'
import { themeLabel } from '../../data/quotes'
import { getDay, setDayNote } from '../../lib/actions'
import { todayKey } from '../../lib/date'
import { getState } from '../../lib/store'
import { cn } from '../../lib/cn'
import { NOTE_LIMIT, appendReflection } from './quote-utils'
import { reflectionsFor } from './reflection'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function OverlayButton({ icon: Icon, label, onClick, active, showLabel = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={showLabel ? undefined : label}
      aria-pressed={active}
      title={label}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-medium transition',
        showLabel ? 'px-4' : 'w-11',
        active ? 'bg-lotus-500/20 text-lotus-300' : 'bg-white/5 text-stone-200 hover:bg-white/10',
      )}
    >
      <Icon className="h-5 w-5" fill={active ? 'currentColor' : 'none'} aria-hidden />
      {showLabel && <span>{label}</span>}
    </button>
  )
}

/** Ô ghi lại điều nhận ra — lưu nối vào ghi chú nhật ký của hôm nay. */
function ReflectionJournal({ quote }) {
  const toast = useToast()
  const id = useId()
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  const save = () => {
    const key = todayKey()
    const res = appendReflection(getDay(getState().logs, key).note, quote, text)
    if (!res.ok) {
      toast(
        res.reason === 'empty'
          ? { title: 'Bạn chưa viết gì', description: 'Chỉ cần một câu ngắn về điều mình nhận ra.', tone: 'info' }
          : {
              title: 'Ghi chú hôm nay đã gần đầy',
              description: `Nhật ký mỗi ngày giới hạn ${NOTE_LIMIT} ký tự. Bạn hãy rút gọn lại nhé.`,
              tone: 'warning',
            },
      )
      return
    }
    setDayNote(res.note, key)
    setSaved(true)
    setText('')
    toast({ title: 'Đã lưu vào nhật ký hôm nay', description: 'Xem lại trong mục Nhật ký tu tập.' })
  }

  return (
    <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-stone-100">
        <NotebookPen className="h-4 w-4 text-jade-300" aria-hidden />
        Điều mình nhận ra
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
        }}
        maxLength={600}
        rows={3}
        placeholder="Viết vài dòng, không cần hay — chỉ cần thật…"
        className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-night/60 px-4 py-3 text-base text-stone-100 placeholder:text-stone-500 focus:border-jade-400 focus:ring-2 focus:ring-jade-400/30 focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-400">{text.length}/600</p>
        <button
          type="button"
          onClick={save}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-jade-500 px-5 text-sm font-semibold text-jade-950 transition hover:bg-jade-400 disabled:opacity-50"
          disabled={!text.trim()}
        >
          {saved ? <Check className="h-4 w-4" aria-hidden /> : <NotebookPen className="h-4 w-4" aria-hidden />}
          {saved ? 'Đã lưu' : 'Lưu vào nhật ký hôm nay'}
        </button>
      </div>
    </div>
  )
}

/**
 * Chế độ "Chiêm nghiệm": một lời dạy chiếm trọn màn hình, nền tối tĩnh lặng,
 * vòng sáng thở chậm để người đọc dừng lại, kèm câu tự vấn và chỗ ghi nhận.
 * Luôn dùng nền tối (kể cả ở giao diện sáng) để tạo cảm giác tách khỏi nhịp lướt thường ngày.
 */
export default function ContemplateView({ quote, favorite, onClose, onNext, onToggleFavorite, onShare }) {
  const panelRef = useRef(null)
  const headingRef = useRef(null)
  const handlers = useRef({ onClose, onNext })
  const titleId = useId()

  useEffect(() => {
    handlers.current = { onClose, onNext }
  })

  useEffect(() => {
    const prevFocus = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      // Khi đang mở hộp thoại con (vd. tạo ảnh chia sẻ) thì để hộp thoại đó xử lý phím
      if (document.querySelectorAll('[role="dialog"]').length > 1) return
      if (e.key === 'Escape') {
        handlers.current.onClose?.()
        return
      }
      const typing = /^(TEXTAREA|INPUT)$/.test(e.target?.tagName ?? '')
      if (e.key === 'ArrowRight' && !typing) {
        handlers.current.onNext?.()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      // Giữ focus trong lớp phủ để người dùng bàn phím không lạc ra trang phía sau
      const nodes = panelRef.current.querySelectorAll(FOCUSABLE)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => headingRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [])

  const questions = reflectionsFor(quote)

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 overflow-y-auto bg-night text-stone-100"
    >
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-jade-950/70 via-night to-night" aria-hidden />
      <div className="pointer-events-none fixed inset-0 grid place-items-center" aria-hidden>
        <div className="h-[22rem] w-[22rem] animate-breathe rounded-full bg-radial from-jade-500/25 via-jade-700/10 to-transparent sm:h-[34rem] sm:w-[34rem]" />
      </div>

      <div className="relative mx-auto flex min-h-full max-w-3xl flex-col px-5 pt-5 pb-10 sm:px-8">
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-xs font-semibold tracking-widest text-jade-300 uppercase">
            Chiêm nghiệm · {themeLabel(quote.theme)}
          </h2>
          <div className="flex items-center gap-2">
            <OverlayButton icon={Heart} label={favorite ? 'Bỏ yêu thích' : 'Yêu thích'} active={favorite} onClick={() => onToggleFavorite(quote)} />
            <OverlayButton icon={ImageDown} label="Tạo ảnh chia sẻ" onClick={() => onShare(quote)} />
            <OverlayButton icon={X} label="Đóng chế độ chiêm nghiệm" onClick={onClose} />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-12 text-center sm:py-20">
          <blockquote key={quote.id} className="animate-fade-up">
            <p
              ref={headingRef}
              tabIndex={-1}
              className="font-serif text-[1.75rem] leading-snug font-medium text-balance text-stone-50 outline-none sm:text-[2.6rem] sm:leading-[1.3]"
            >
              <span className="text-saffron-300" aria-hidden>“</span>
              {quote.text}
              <span className="text-saffron-300" aria-hidden>”</span>
            </p>
            {quote.gloss && <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-stone-300 italic">{quote.gloss}</p>}
            <footer className="mt-6 text-sm font-semibold tracking-wide text-jade-300 sm:text-base">— {quote.source}</footer>
          </blockquote>
          <p className="mx-auto mt-10 max-w-md text-sm leading-relaxed text-stone-400">
            Đọc thật chậm. Thở vào khi vòng sáng nở ra, thở ra khi vòng sáng thu lại — ba hơi thở rồi hãy đọc tiếp.
          </p>
        </div>

        <section aria-labelledby={`${titleId}-q`} className="space-y-4">
          <h3 id={`${titleId}-q`} className="font-serif text-xl font-semibold text-stone-50">
            Tự vấn
          </h3>
          <ol className="grid gap-3 sm:grid-cols-3">
            {questions.map((q, i) => (
              <li key={q} className="rounded-3xl bg-white/5 p-4 text-[15px] leading-relaxed text-stone-200 ring-1 ring-white/10">
                <span className="mb-2 grid h-7 w-7 place-items-center rounded-full bg-jade-500/20 text-xs font-bold text-jade-200" aria-hidden>
                  {i + 1}
                </span>
                {q}
              </li>
            ))}
          </ol>
          <ReflectionJournal key={quote.id} quote={quote} />
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <OverlayButton icon={Shuffle} label="Lời dạy khác" onClick={onNext} showLabel />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-2xl px-4 text-sm font-medium text-stone-300 hover:bg-white/5 hover:text-white"
            >
              Trở về
            </button>
          </div>
          <p className="text-center text-xs text-stone-500">Phím tắt: → lời dạy khác · Esc để thoát</p>
        </section>
      </div>
    </div>,
    document.body,
  )
}
