import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AArrowDown, AArrowUp, ArrowLeft, Clock, Expand, ListOrdered, RotateCcw, Share2, Shrink } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toast-context'
import { getState, useStore } from '../../lib/store'
import { recordSession, setBookmark, updateSettings } from '../../lib/actions'
import { playBell, playMo } from '../../lib/sound'
import { todayKey } from '../../lib/date'
import { cn } from '../../lib/cn'
import { getSutra } from '../../data/sutras'
import {
  DEFAULT_PACE,
  FONT_MAX,
  FONT_MIN,
  FONT_STEP,
  clampFontSize,
  clampIndex,
  estimateSeconds,
  flattenSutra,
  getPace,
  lineSeconds,
  parseLineParam,
} from './reader'
import { categoryLabel, categoryMeta } from './category-meta'
import { prefersReducedMotion, useFocusMode, useReadingClock, useWakeLock } from './hooks'
import { shareOrCopy, sutraUrl } from './share'
import { FavoriteButton } from './SutraCard'
import ReaderText from './ReaderText'
import ChantBar from './ChantBar'
import MeaningPanel from './MeaningPanel'
import CompleteDialog from './CompleteDialog'

const TYPING = 'input, textarea, select, [contenteditable="true"]'
const NATIVE_ACTIVATE = 'button, a, [role="radio"], [role="tab"], [role="switch"]'

/**
 * Trình đọc tụng một bài. Trang cha đặt `key={id}` để mỗi bài có trạng thái riêng (dòng đang tụng, đồng hồ…).
 */
export default function SutraReader({ sutra }) {
  const toast = useToast()
  const [params] = useSearchParams()
  const { sections, lines } = useMemo(() => flattenSutra(sutra, getSutra), [sutra])
  const total = lines.length
  const refs = useMemo(() => sections.filter((s) => s.ref).map((s) => s.ref), [sections])
  const hasMeaning = sutra.meaning?.length > 0 || sutra.notes?.length > 0 || refs.length > 0

  // Vị trí bắt đầu: ?dong= (từ kết quả tìm kiếm) > mốc đã lưu > đầu bài
  const [initial] = useState(() => {
    const fromParam = parseLineParam(params.get('dong'), total)
    if (fromParam != null) return { index: fromParam, resumed: false }
    const saved = clampIndex(getState().bookmarks[sutra.id] ?? 0, total)
    return { index: saved, resumed: saved > 0 }
  })
  const [active, setActive] = useState(initial.index)
  const [playing, setPlaying] = useState(false)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [showResume, setShowResume] = useState(initial.resumed)
  const [tab, setTab] = useState('text')
  const [dialog, setDialog] = useState(null) // null | { phase: 'confirm'|'done', seconds }

  const fontSize = useStore((s) => clampFontSize(s.settings.readerFontSize))
  const pace = useStore((s) => getPace(s.settings.chantPace ?? DEFAULT_PACE).value)
  const mo = useStore((s) => s.settings.chantMo ?? true)
  const favorite = useStore((s) => s.favorites.sutras.includes(sutra.id))
  const todayCount = useStore((s) => s.logs[todayKey()]?.tung ?? 0)
  const timesRead = useStore((s) => s.sessions.reduce((n, x) => (x.type === 'tung' && x.ref === sutra.id ? n + 1 : n), 0))

  const { focus, enter: enterFocus, exit: exitFocus } = useFocusMode()
  const clock = useReadingClock()
  useWakeLock(playing)

  const lineEls = useRef(new Map())
  const focusRoot = useRef(null)
  const firstScroll = useRef(true)

  const goTo = useCallback(
    (i) => {
      const n = clampIndex(i, total)
      setActive(n)
      setBookmark(sutra.id, n)
      setShowResume(false)
      if (n < total - 1) setReachedEnd(false)
    },
    [sutra.id, total],
  )

  // Nhịp tụng: mỗi dòng giữ trong một khoảng tuỳ số âm tiết; hết bài thì tự dừng
  useEffect(() => {
    if (!playing) return
    const ms = lineSeconds(lines[active]?.text, pace) * 1000
    const t = setTimeout(() => {
      if (active >= total - 1) {
        setPlaying(false)
        setReachedEnd(true)
        return
      }
      if (mo) playMo()
      goTo(active + 1)
    }, ms)
    return () => clearTimeout(t)
  }, [playing, active, pace, mo, lines, total, goTo])

  // Cuộn mượt tới dòng đang tụng (bỏ qua lần đầu nếu đang ở đầu bài)
  useEffect(() => {
    if (firstScroll.current) {
      firstScroll.current = false
      if (active === 0) return
    }
    lineEls.current.get(active)?.scrollIntoView?.({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [active, focus])

  useEffect(() => {
    if (focus) focusRoot.current?.focus()
  }, [focus])

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false)
      return
    }
    // Đã tụng tới cuối mà bấm phát lại → bắt đầu từ đầu
    if (active >= total - 1 && reachedEnd) goTo(0)
    if (mo) playMo()
    setShowResume(false)
    setTab('text')
    setPlaying(true)
  }, [playing, active, total, reachedEnd, mo, goTo])

  const changeFont = useCallback((delta) => updateSettings({ readerFontSize: clampFontSize(fontSize + delta) }), [fontSize])

  // Phím tắt: Space phát/dừng, ←/→ (hoặc K/J) lùi/tới dòng, +/- cỡ chữ, F chế độ tập trung
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest(TYPING)) return
      if (document.querySelector('[role="dialog"]:not([data-focus-root])')) return
      const key = e.key.toLowerCase()
      if (key === ' ' && !target?.closest(NATIVE_ACTIVATE)) {
        e.preventDefault()
        togglePlay()
      } else if (key === 'arrowright' || key === 'j') goTo(active + 1)
      else if (key === 'arrowleft' || key === 'k') goTo(active - 1)
      else if (key === '+' || key === '=') changeFont(FONT_STEP)
      else if (key === '-') changeFont(-FONT_STEP)
      else if (key === 'f') (focus ? exitFocus : enterFocus)()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, focus, togglePlay, goTo, changeFont, enterFocus, exitFocus])

  const lineRef = useCallback((index, el) => {
    if (el) lineEls.current.set(index, el)
    else lineEls.current.delete(index)
  }, [])

  const selectLine = useCallback(
    (i) => {
      goTo(i)
      // Đang tụng theo: nhảy tới dòng đó và tụng tiếp từ đây
      if (playing && mo) playMo()
    },
    [goTo, playing, mo],
  )

  const share = async () => {
    try {
      const result = await shareOrCopy({ title: sutra.title, text: `${sutra.title} — ${sutra.subtitle}`, url: sutraUrl(sutra.id) })
      if (result === 'copied') toast({ title: 'Đã chép liên kết', description: 'Dán vào tin nhắn để gửi cho người thân.', tone: 'info' })
      if (result === 'unsupported') toast({ title: 'Thiết bị chưa hỗ trợ chia sẻ', description: sutraUrl(sutra.id), tone: 'warning' })
    } catch {
      toast({ title: 'Không chép được liên kết', description: 'Trình duyệt chặn quyền truy cập bộ nhớ tạm.', tone: 'warning' })
    }
  }

  const openComplete = () => {
    setPlaying(false)
    setDialog({ phase: 'confirm', seconds: clock.read() })
  }

  const confirmComplete = () => {
    const seconds = clock.read()
    recordSession({ type: 'tung', ref: sutra.id, duration: seconds })
    playBell()
    toast({ title: 'Đã ghi nhận thời tụng', description: `${sutra.title} — tâm an là đủ.` })
    clock.reset()
    goTo(0)
    setReachedEnd(false)
    setDialog({ phase: 'done', seconds })
  }

  const remaining = useMemo(() => estimateSeconds(lines, pace, active), [lines, pace, active])
  const meta = categoryMeta(sutra.category)
  const includesHoiHuong = sutra.id === 'ke-hoi-huong' || refs.some((r) => r.id === 'ke-hoi-huong')
  const showText = focus || tab === 'text'

  const fontControls = (
    <div className="flex items-center gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-white/5" role="group" aria-label="Cỡ chữ">
      <button
        type="button"
        onClick={() => changeFont(-FONT_STEP)}
        disabled={fontSize <= FONT_MIN}
        aria-label="Giảm cỡ chữ"
        className="grid h-9 w-9 place-items-center rounded-xl text-stone-700 transition hover:bg-white disabled:opacity-40 dark:text-stone-200 dark:hover:bg-white/10"
      >
        <AArrowDown className="h-5 w-5" aria-hidden />
      </button>
      <span className="w-8 text-center text-sm font-semibold text-stone-700 tabular-nums dark:text-stone-200" aria-live="polite">
        {fontSize}
      </span>
      <button
        type="button"
        onClick={() => changeFont(FONT_STEP)}
        disabled={fontSize >= FONT_MAX}
        aria-label="Tăng cỡ chữ"
        className="grid h-9 w-9 place-items-center rounded-xl text-stone-700 transition hover:bg-white disabled:opacity-40 dark:text-stone-200 dark:hover:bg-white/10"
      >
        <AArrowUp className="h-5 w-5" aria-hidden />
      </button>
    </div>
  )

  return (
    <div className="animate-fade-up">
      <Button to="/kinh" variant="ghost" size="sm" className="-ml-2 mb-4">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Thư viện kinh
      </Button>

      <PageHeader
        eyebrow={categoryLabel(sutra.category)}
        title={sutra.title}
        subtitle={sutra.subtitle}
        icon={meta.icon}
        actions={
          <>
            <FavoriteButton id={sutra.id} title={sutra.title} active={favorite} />
            <Button variant="outline" size="icon" onClick={share} aria-label="Chia sẻ bài này" title="Chia sẻ">
              <Share2 className="h-5 w-5" aria-hidden />
            </Button>
            <Button variant="secondary" onClick={enterFocus}>
              <Expand className="h-4 w-4" aria-hidden />
              Tập trung
            </Button>
          </>
        }
      />

      <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" aria-hidden />~{sutra.minutes} phút
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ListOrdered className="h-4 w-4" aria-hidden />
          {total} dòng
        </span>
        {sutra.tradition && <span>{sutra.tradition}</span>}
        {timesRead > 0 && <span className="text-jade-700 dark:text-jade-300">Bạn đã tụng {timesRead} lần</span>}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {hasMeaning ? <Tabs value={tab} onChange={setTab} /> : <span />}
        {fontControls}
      </div>

      <div
        ref={focusRoot}
        tabIndex={focus ? -1 : undefined}
        role={focus ? 'dialog' : undefined}
        aria-modal={focus ? 'true' : undefined}
        aria-label={focus ? `Chế độ tập trung — ${sutra.title}` : undefined}
        data-focus-root={focus ? '' : undefined}
        className={cn(focus && 'fixed inset-0 z-50 overflow-y-auto bg-paper px-4 outline-none sm:px-8 dark:bg-night')}
      >
        {focus && (
          <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center justify-between gap-3 bg-paper/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 dark:bg-night/90">
            <p className="min-w-0 truncate font-serif text-base font-semibold text-stone-700 dark:text-stone-200">{sutra.title}</p>
            <div className="flex items-center gap-2">
              {fontControls}
              <Button variant="outline" onClick={exitFocus} aria-label="Thoát chế độ tập trung">
                <Shrink className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Thoát</span>
              </Button>
            </div>
          </div>
        )}

        <div
          id="kinh-panel"
          role={hasMeaning && !focus ? 'tabpanel' : undefined}
          aria-labelledby={hasMeaning && !focus ? `tab-${showText ? 'text' : 'meaning'}` : undefined}
          className={cn(
            'relative overflow-hidden',
            focus
              ? 'pt-[8vh] pb-10'
              : 'rounded-4xl border border-stone-200/70 bg-white px-4 py-10 shadow-soft sm:px-10 sm:py-14 dark:border-white/5 dark:bg-night-2',
          )}
        >
          {!focus && <div className="bg-lotus-pattern pointer-events-none absolute inset-x-0 top-0 h-40 opacity-60" aria-hidden />}
          <div className="relative">
            {showText ? (
              <>
                {showResume && (
                  <ResumeBanner
                    line={active + 1}
                    onContinue={togglePlay}
                    onRestart={() => goTo(0)}
                  />
                )}
                <ReaderText
                  sections={sections}
                  lines={lines}
                  active={active}
                  playing={playing}
                  fontSize={fontSize}
                  onSelect={selectLine}
                  lineRef={lineRef}
                />
                <EndMark reachedEnd={reachedEnd} onComplete={openComplete} />
              </>
            ) : (
              <MeaningPanel sutra={sutra} refs={refs} fontSize={fontSize} />
            )}
          </div>
        </div>

        {showText && (
          <ChantBar
            active={active}
            total={total}
            playing={playing}
            remaining={remaining}
            pace={pace}
            mo={mo}
            clock={clock}
            focus={focus}
            onToggle={togglePlay}
            onPrev={() => goTo(active - 1)}
            onNext={() => goTo(active + 1)}
            onPace={(v) => updateSettings({ chantPace: v })}
            onMo={(v) => updateSettings({ chantMo: v })}
            onComplete={openComplete}
          />
        )}

        {!focus && showText && (
          <p className="mt-4 hidden text-center text-xs text-stone-400 lg:block dark:text-stone-500">
            Phím tắt: Space phát/dừng · ← → lùi/tới dòng · + − cỡ chữ · F chế độ tập trung
          </p>
        )}
      </div>

      <CompleteDialog
        open={Boolean(dialog)}
        phase={dialog?.phase}
        sutraTitle={sutra.title}
        seconds={dialog?.seconds ?? 0}
        linesRead={active + 1}
        total={total}
        todayCount={todayCount}
        suggestHoiHuong={!includesHoiHuong}
        onConfirm={confirmComplete}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}

const TABS = [
  { value: 'text', label: 'Kinh văn' },
  { value: 'meaning', label: 'Lược giải' },
]

/** Tablist chuẩn ARIA: mũi tên trái/phải để chuyển tab. */
function Tabs({ value, onChange }) {
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    e.stopPropagation()
    const i = TABS.findIndex((t) => t.value === value)
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length]
    onChange(next.value)
    document.getElementById(`tab-${next.value}`)?.focus()
  }
  return (
    <div role="tablist" aria-label="Nội dung bài" className="inline-flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-white/5">
      {TABS.map((t) => {
        const selected = t.value === value
        return (
          <button
            key={t.value}
            id={`tab-${t.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="kinh-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={onKeyDown}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition',
              selected
                ? 'bg-white text-jade-800 shadow-sm dark:bg-jade-800 dark:text-white'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function ResumeBanner({ line, onContinue, onRestart }) {
  return (
    <div className="mx-auto mb-8 flex max-w-[42rem] flex-col items-center gap-3 rounded-3xl bg-jade-50 p-4 text-center sm:flex-row sm:justify-between sm:text-left dark:bg-jade-900/30">
      <p className="flex items-center gap-2 text-sm text-jade-900 dark:text-jade-100">
        <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
        Lần trước bạn dừng ở dòng {line}.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onRestart}>
          Đọc từ đầu
        </Button>
        <Button size="sm" onClick={onContinue}>
          Tụng tiếp
        </Button>
      </div>
    </div>
  )
}

function EndMark({ reachedEnd, onComplete }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[42rem] flex-col items-center gap-4 text-center">
      <svg viewBox="0 0 120 16" className="h-4 w-32 text-saffron-400/80" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <path d="M0 8h44M76 8h44" />
        <path d="M60 2c3 2.6 4.4 4.6 4.4 6S63 11.4 60 14c-3-2.6-4.4-4.6-4.4-6S57 4.6 60 2Z" />
        <circle cx="50" cy="8" r="1.6" fill="currentColor" />
        <circle cx="70" cy="8" r="1.6" fill="currentColor" />
      </svg>
      {reachedEnd && <p className="font-serif text-lg text-jade-800 dark:text-jade-200">Đã tụng hết bài. Xin dừng lại một hơi thở.</p>}
      <Button variant={reachedEnd ? 'primary' : 'secondary'} size="lg" onClick={onComplete}>
        Hoàn thành thời tụng
      </Button>
    </div>
  )
}
