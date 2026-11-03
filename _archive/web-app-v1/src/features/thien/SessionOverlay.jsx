import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, Pause, Play, Square, SunMedium, X } from 'lucide-react'
import ProgressRing from '../../components/ui/ProgressRing'
import { formatDuration } from '../../lib/date'
import { cn } from '../../lib/cn'
import BreathCircle from './BreathCircle'
import CompletionPanel from './CompletionPanel'
import { MINDFUL_PROMPTS } from './content'
import { promptIndex } from './schedule'
import { humanDuration, shouldRecord } from './summary'
import useMeditationSession from './useMeditationSession'
import useWakeLock from './useWakeLock'

const PROMPT_EVERY_SEC = 150

/** Kích thước vòng tiến độ theo khung nhìn — đủ lớn trên điện thoại, không quá to trên màn hình rộng. */
function useRingSize() {
  const calc = () => {
    if (typeof window === 'undefined') return 300
    const byWidth = window.innerWidth - 48
    const byHeight = window.innerHeight - 340
    return Math.round(Math.max(220, Math.min(400, byWidth, byHeight)))
  }
  const [size, setSize] = useState(calc)
  useEffect(() => {
    const onResize = () => setSize(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/** Giữ focus trong lớp phủ & khoá cuộn trang phía sau (giống Modal dùng chung). */
function useOverlayFocus(ref) {
  useEffect(() => {
    const prevFocus = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    const onKey = (e) => {
      if (e.key !== 'Tab' || !ref.current) return
      const nodes = ref.current.querySelectorAll('button:not([disabled]), [href], input, textarea, [tabindex]:not([tabindex="-1"])')
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
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [ref])
}

function RoundButton({ label, onClick, children, primary = false, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'grid place-items-center rounded-full transition focus-visible:outline-jade-300',
        primary
          ? 'h-20 w-20 bg-jade-400 text-jade-950 shadow-[0_0_40px_-8px_rgb(75_179_153/0.8)] hover:bg-jade-300'
          : 'h-14 w-14 border border-white/15 bg-white/5 text-stone-200 hover:bg-white/10',
        className,
      )}
    >
      {children}
    </button>
  )
}

function PrepView({ session, onCancel }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="text-sm font-semibold tracking-[0.3em] text-jade-300 uppercase">Chuẩn bị</p>
      <p className="font-serif text-8xl font-light tabular-nums text-stone-50" role="timer" aria-label={`Còn ${session.prepLeftSec} giây chuẩn bị`}>
        {session.prepLeftSec}
      </p>
      <p className="max-w-sm text-lg leading-relaxed text-stone-300">
        Ngồi ngay ngắn, thả lỏng đôi vai, khép hờ mắt. Chuông sẽ báo khi bắt đầu.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={session.skipPrep}
          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-jade-400 px-6 font-medium text-jade-950 hover:bg-jade-300"
        >
          <Play className="h-5 w-5" aria-hidden /> Bắt đầu ngay
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-12 items-center rounded-2xl border border-white/15 px-6 font-medium text-stone-200 hover:bg-white/10"
        >
          Huỷ
        </button>
      </div>
    </div>
  )
}

function ConfirmEnd({ elapsedSec, onContinue, onEnd }) {
  const enough = shouldRecord(elapsedSec)
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-night/80 p-6 backdrop-blur-sm">
      <div role="alertdialog" aria-labelledby="thien-end-title" aria-describedby="thien-end-desc" className="w-full max-w-sm animate-fade-up rounded-4xl border border-white/10 bg-night-2 p-6 text-center shadow-2xl">
        <h2 id="thien-end-title" className="font-serif text-xl font-semibold text-stone-50">
          Kết thúc buổi ngồi?
        </h2>
        <p id="thien-end-desc" className="mt-2 text-sm leading-relaxed text-stone-300">
          Bạn đã ngồi {humanDuration(elapsedSec)}.{' '}
          {enough ? 'Thời gian này sẽ được ghi vào nhật ký hôm nay.' : 'Buổi ngồi dưới 1 phút sẽ không được ghi vào nhật ký.'}
        </p>
        <div className="mt-6 grid gap-2">
          <button type="button" onClick={onContinue} autoFocus className="h-12 rounded-2xl bg-jade-400 font-medium text-jade-950 hover:bg-jade-300">
            Ngồi tiếp
          </button>
          <button type="button" onClick={onEnd} className="h-12 rounded-2xl border border-white/15 font-medium text-stone-200 hover:bg-white/10">
            Kết thúc
          </button>
        </div>
      </div>
    </div>
  )
}

function SitView({ session, config, ringSize, onAskEnd }) {
  const { phase, paused, pattern } = session
  const natural = !pattern.phases.length
  const elapsedSec = Math.floor(session.elapsedMs / 1000)
  // Mỗi buổi bắt đầu từ một câu nhắc khác nhau để không nhàm
  const [offset] = useState(() => Math.floor(Math.random() * MINDFUL_PROMPTS.length))
  const prompt = config.prompts ? MINDFUL_PROMPTS[promptIndex(elapsedSec, MINDFUL_PROMPTS.length, PROMPT_EVERY_SEC, offset)] : null

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-4">
      <ProgressRing value={session.progress} size={ringSize} stroke={4} tone="jade" label="Tiến độ buổi ngồi">
        <div className="absolute inset-[7%]">
          <BreathCircle phase={phase} paused={paused} natural={natural}>
            {paused ? (
              <p className="font-serif text-2xl text-stone-100">Đang tạm dừng</p>
            ) : natural ? (
              <p className="font-serif text-2xl text-stone-100">Thở tự nhiên</p>
            ) : (
              <>
                {/* Không dùng aria-live: pha đổi vài giây một lần sẽ làm trình đọc màn hình nói liên tục */}
                <p className="font-serif text-3xl text-stone-50 sm:text-4xl">
                  {phase?.label}
                </p>
                <p className="mt-1 text-lg tabular-nums text-jade-200" aria-hidden>
                  {phase?.remainingSec}
                </p>
              </>
            )}
          </BreathCircle>
        </div>
      </ProgressRing>

      <div className="text-center">
        <p className="font-sans text-5xl font-light tracking-tight tabular-nums text-stone-50 sm:text-6xl" role="timer" aria-label={`Còn lại ${humanDuration(session.remainingMs / 1000)}`}>
          {formatDuration(Math.ceil(session.remainingMs / 1000))}
        </p>
        <p className="mt-1 text-sm text-stone-400">đã ngồi {formatDuration(elapsedSec)}</p>
      </div>

      <p className="min-h-14 max-w-md text-center font-serif text-lg leading-relaxed text-stone-300 italic transition-opacity">
        {prompt}
      </p>

      <div className="flex items-center gap-5">
        <RoundButton label="Kết thúc buổi ngồi" onClick={onAskEnd}>
          <Square className="h-5 w-5" aria-hidden />
        </RoundButton>
        <RoundButton primary label={paused ? 'Tiếp tục' : 'Tạm dừng'} onClick={paused ? session.resume : session.pause}>
          {paused ? <Play className="h-8 w-8" aria-hidden /> : <Pause className="h-8 w-8" aria-hidden />}
        </RoundButton>
        <span className="h-14 w-14" aria-hidden />
      </div>
      <p className="hidden text-xs text-stone-500 sm:block">Phím cách: tạm dừng / tiếp tục · Esc: kết thúc</p>
    </div>
  )
}

/**
 * Lớp phủ toàn màn hình khi đang ngồi — luôn nền tối dịu (bọc class `dark`)
 * để không chói mắt, kể cả khi ứng dụng đang ở giao diện sáng.
 */
export default function SessionOverlay({ config, onComplete, onClose }) {
  const ref = useRef(null)
  const [confirming, setConfirming] = useState(false)
  const wasRunningRef = useRef(false)
  const session = useMeditationSession(config, onComplete)
  const wakeLock = useWakeLock(session.stage !== 'done')
  const ringSize = useRingSize()
  useOverlayFocus(ref)

  const askEnd = useCallback(() => {
    wasRunningRef.current = !session.paused
    session.pause()
    setConfirming(true)
  }, [session])

  const continueSitting = () => {
    setConfirming(false)
    if (wasRunningRef.current) session.resume()
  }

  const endNow = () => {
    setConfirming(false)
    session.finish()
  }

  // Phím tắt: Space = tạm dừng/tiếp tục, Esc = hỏi kết thúc (bỏ qua khi đang gõ hoặc focus vào nút)
  useEffect(() => {
    if (session.stage !== 'sit' || confirming) return
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (e.key === 'Escape') {
        e.preventDefault()
        askEnd()
        return
      }
      if (e.key !== ' ' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      if (session.paused) session.resume()
      else session.pause()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [session, confirming, askEnd])

  const title = useMemo(() => {
    if (session.stage === 'prep') return 'Chuẩn bị ngồi thiền'
    if (session.stage === 'done') return 'Buổi ngồi đã xong'
    return 'Đang ngồi thiền'
  }, [session.stage])

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="dark fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-night text-stone-100 outline-none"
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgb(26_96_85/0.45),transparent_60%),radial-gradient(ellipse_at_50%_110%,rgb(232_73_125/0.10),transparent_50%)]" />

      <header className="relative flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
          <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
            {config.minutes} phút · {session.pattern.label}
          </span>
          {config.intervalMin > 0 && session.stage !== 'done' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
              <BellRing className="h-3.5 w-3.5" aria-hidden /> mỗi {config.intervalMin} phút
            </span>
          )}
          {wakeLock && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10" title="Màn hình sẽ không tự tắt trong lúc ngồi">
              <SunMedium className="h-3.5 w-3.5" aria-hidden /> Giữ màn hình sáng
            </span>
          )}
        </div>
        {session.stage === 'sit' && (
          <button type="button" onClick={askEnd} aria-label="Đóng và kết thúc buổi ngồi" className="grid h-11 w-11 place-items-center rounded-full text-stone-400 hover:bg-white/10 hover:text-stone-100">
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </header>

      <div className="relative flex flex-1 flex-col">
        {session.stage === 'prep' && <PrepView session={session} onCancel={onClose} />}
        {session.stage === 'sit' && <SitView session={session} config={config} ringSize={ringSize} onAskEnd={askEnd} />}
        {session.stage === 'done' && session.result && <CompletionPanel result={session.result} onClose={onClose} />}
      </div>

      {confirming && <ConfirmEnd elapsedSec={Math.floor(session.elapsedMs / 1000)} onContinue={continueSitting} onEnd={endNow} />}
    </div>,
    document.body,
  )
}
