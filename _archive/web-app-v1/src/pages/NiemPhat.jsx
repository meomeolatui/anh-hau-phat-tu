import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleDot, Hand, Maximize2, Minimize2, Pause, Pencil, Play, RotateCcw, Sparkles, Square, VolumeX } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Segmented from '../components/ui/Segmented'
import { Switch } from '../components/ui/Field'
import { useToast } from '../components/ui/toast-context'
import { useStore } from '../lib/store'
import { updateProfile } from '../lib/actions'
import { haptic, playBead, playBell, playMo } from '../lib/sound'
import { formatDuration, formatNumber, todayKey } from '../lib/date'
import { cn } from '../lib/cn'
import MalaCounter from '../features/niem-phat/MalaCounter'
import MantraPicker from '../features/niem-phat/MantraPicker'
import GoalCard from '../features/niem-phat/GoalCard'
import NiemHistory from '../features/niem-phat/NiemHistory'
import NiemGuide from '../features/niem-phat/NiemGuide'
import { BEAD_SIZES } from '../features/niem-phat/mala'
import { DEFAULT_MANTRA, cleanMantra } from '../features/niem-phat/mantras'
import { BPM_MAX, BPM_MIN, beatInterval, clampBpm, crossedGoal, sessionSeconds } from '../features/niem-phat/session'
import { loadPrefs, savePrefs } from '../features/niem-phat/storage'
import { shouldCountKey } from '../features/niem-phat/keyboard'
import { useNiemSession } from '../features/niem-phat/useNiemSession'
import { useMetronome } from '../features/niem-phat/useMetronome'
import { useFocusMode, useWakeLock } from '../features/niem-phat/useFocusMode'

const SIZE_OPTIONS = BEAD_SIZES.map((n) => ({ value: n, label: `${n} hạt` }))
const MODE_OPTIONS = [
  { value: 'tay', label: 'Tự lần hạt', icon: Hand },
  { value: 'mo', label: 'Theo nhịp mõ', icon: CircleDot },
]
const ROUND_FLASH_MS = 3500

export default function NiemPhat() {
  const toast = useToast()
  const storedMantra = useStore((s) => s.profile.mantra)
  const goal = useStore((s) => s.profile.goals.niem)
  const soundOn = useStore((s) => s.settings.sound)
  const today = todayKey()
  const storedToday = useStore((s) => s.logs[today]?.niem ?? 0)
  const mantra = cleanMantra(storedMantra) || DEFAULT_MANTRA

  const [prefs, setPrefs] = useState(loadPrefs)
  const [running, setRunning] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [roundFlash, setRoundFlash] = useState(0)
  const padRef = useRef(null)
  const panelRef = useRef(null)
  const focus = useFocusMode(panelRef)
  const auto = prefs.mode === 'mo'

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])
  const setPref = useCallback((patch) => setPrefs((p) => ({ ...p, ...patch })), [])

  const onRound = useCallback(
    (s) => {
      playBell({ pitch: 220 })
      haptic([30, 40, 30])
      setRoundFlash(s.rounds)
      toast({ title: `Tròn chuỗi thứ ${s.rounds}`, description: 'Thở một hơi nhẹ, rồi tiếp tục với tâm an.', tone: 'success', duration: 2500 })
    },
    [toast],
  )

  const onRestore = useCallback(
    ({ kind, total }) => {
      if (kind === 'archived') {
        toast({ title: 'Đã lưu phiên niệm lần trước', description: `${formatNumber(total)} câu đã được ghi vào lịch sử.`, tone: 'info' })
        return
      }
      toast({ title: 'Tiếp tục phiên đang dở', description: `${formatNumber(total)} câu đã niệm vẫn được giữ nguyên.`, tone: 'info' })
    },
    [toast],
  )

  const { session, tap, resetBeads, endSession } = useNiemSession({ size: prefs.size, mantra, onRound, onRestore })
  const todayCount = storedToday + session.pending

  const beat = useCallback(() => {
    playMo()
    tap()
  }, [tap])

  useMetronome({ running: running && auto, bpm: prefs.bpm, onBeat: beat, startDelay: beatInterval(prefs.bpm) })
  useWakeLock(focus.active || running)

  const toggleRunning = useCallback(() => {
    if (running) {
      setRunning(false)
      return
    }
    // Nhịp đầu phát ngay trong thao tác chạm để trình duyệt cho phép mở âm thanh
    beat()
    setRunning(true)
  }, [running, beat])

  const activate = useCallback(() => {
    if (auto) {
      toggleRunning()
      return
    }
    playBead()
    if (prefs.mo) playMo()
    haptic(8)
    tap()
  }, [auto, toggleRunning, prefs.mo, tap])

  // Bàn phím toàn trang: Space / Enter / ↓
  const activateRef = useRef(activate)
  useEffect(() => {
    activateRef.current = activate
  })
  useEffect(() => {
    const onKey = (e) => {
      if (!shouldCountKey(e, padRef.current, { dialogOpen: pickerOpen })) return
      e.preventDefault()
      if (!e.repeat) activateRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pickerOpen])

  // Ẩn trang thì dừng nhịp mõ — không đếm khi người niệm không còn ở đây
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') setRunning(false)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    if (!roundFlash) return undefined
    const t = setTimeout(() => setRoundFlash(0), ROUND_FLASH_MS)
    return () => clearTimeout(t)
  }, [roundFlash])

  // Chúc mừng một lần mỗi ngày khi vừa vượt mục tiêu
  const prevToday = useRef(todayCount)
  useEffect(() => {
    const prev = prevToday.current
    prevToday.current = todayCount
    if (!crossedGoal(prev, todayCount, goal) || prefs.celebrated === today) return
    setPref({ celebrated: today })
    playBell({ strong: true, pitch: 196 })
    toast({
      title: 'Đã tròn mục tiêu hôm nay',
      description: `${formatNumber(goal)} câu Phật hiệu. Cảm ơn bạn đã dành thời gian cho chính mình.`,
      tone: 'success',
      duration: 6000,
    })
  }, [todayCount, goal, today, prefs.celebrated, setPref, toast])

  const changeMode = (mode) => {
    setRunning(false)
    setPref({ mode })
  }

  const handleEnd = () => {
    setRunning(false)
    const result = endSession()
    if (!result) {
      toast({ title: 'Phiên này chưa có câu niệm nào', tone: 'info' })
      return
    }
    playBell({})
    toast({ title: 'Đã lưu phiên niệm Phật', description: `${formatNumber(result.count)} câu · ${formatDuration(result.duration)}` })
  }

  const changeMantra = (text) => {
    updateProfile({ mantra: text })
    toast({ title: 'Đã đổi câu niệm', description: text, tone: 'info', duration: 2500 })
  }

  return (
    // Không đặt animation/transform ở khối bọc: transform làm lớp phủ "fixed" của chế độ tập trung bị lệch
    <div>
      <PageHeader
        eyebrow="Tràng hạt"
        title="Niệm Phật"
        subtitle="Lần chuỗi, nhiếp tâm vào từng câu Phật hiệu. Số câu được lưu tự động vào nhật ký hôm nay."
        icon={CircleDot}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          ref={panelRef}
          aria-label="Tràng hạt niệm Phật"
          className={cn(
            focus.active
              ? 'dark fixed inset-0 z-[55] overflow-y-auto bg-night text-stone-100'
              : 'bg-lotus-pattern rounded-4xl border border-stone-200/70 bg-white shadow-soft lg:sticky lg:top-10 lg:col-span-7 lg:self-start dark:border-white/5 dark:bg-night-2',
          )}
        >
          <div className={cn('mx-auto flex flex-col gap-5', focus.active ? 'min-h-full max-w-3xl justify-center px-5 py-8' : 'p-4 sm:p-6')}>
            <div className="flex items-start justify-between gap-3">
              {focus.active ? (
                <p className="text-sm text-stone-400 tabular-nums">
                  Hôm nay {formatNumber(todayCount)}
                  {goal > 0 && ` / ${formatNumber(goal)}`} câu
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="group inline-flex min-h-11 min-w-0 items-center gap-2 rounded-2xl border border-jade-200 bg-white/70 px-3.5 py-2 text-left transition hover:border-jade-400 dark:border-jade-800 dark:bg-night-3/70"
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold tracking-widest text-jade-600 uppercase dark:text-jade-400">Câu niệm</span>
                    <span className="block truncate font-serif text-sm text-stone-900 sm:text-base dark:text-stone-50">{mantra}</span>
                  </span>
                  <Pencil className="h-4 w-4 shrink-0 text-stone-400 group-hover:text-jade-600" aria-hidden />
                  <span className="sr-only">— đổi câu niệm</span>
                </button>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={focus.active ? focus.exit : focus.enter}
                aria-label={focus.active ? 'Thoát chế độ tập trung' : 'Vào chế độ tập trung toàn màn hình'}
              >
                {focus.active ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
                <span className="hidden sm:inline">{focus.active ? 'Thoát' : 'Tập trung'}</span>
              </Button>
            </div>

            {!focus.active && (
              <Segmented
                options={SIZE_OPTIONS}
                value={prefs.size}
                onChange={(size) => setPref({ size })}
                size="sm"
                aria-label="Số hạt trong chuỗi"
                className="self-center"
              />
            )}

            <MalaCounter
              size={prefs.size}
              session={session}
              mantra={mantra}
              mode={prefs.mode}
              running={running}
              onActivate={activate}
              padRef={padRef}
              focus={focus.active}
            />

            <div className="flex min-h-8 flex-wrap items-center justify-center gap-2 text-sm text-stone-600 dark:text-stone-400" aria-live="polite">
              {roundFlash > 0 ? (
                <span className="inline-flex animate-fade-up items-center gap-1.5 rounded-full bg-saffron-50 px-3 py-1 font-medium text-saffron-800 dark:bg-saffron-900/40 dark:text-saffron-200">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Tròn chuỗi thứ {roundFlash}
                </span>
              ) : (
                <span className="tabular-nums">
                  Phiên này: {formatNumber(session.total)} câu · {formatDuration(sessionSeconds(session))}
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <Segmented options={MODE_OPTIONS} value={prefs.mode} onChange={changeMode} aria-label="Cách đếm" />

              {auto ? (
                <div className="w-full max-w-sm rounded-2xl bg-paper-2/80 p-4 dark:bg-night-3/80">
                  <label htmlFor="np-bpm" className="flex items-baseline justify-between text-sm font-medium text-stone-700 dark:text-stone-300">
                    Nhịp mõ
                    <span className="text-base font-semibold text-jade-800 tabular-nums dark:text-jade-200">{prefs.bpm} nhịp/phút</span>
                  </label>
                  <input
                    id="np-bpm"
                    type="range"
                    min={BPM_MIN}
                    max={BPM_MAX}
                    step={5}
                    value={prefs.bpm}
                    onChange={(e) => setPref({ bpm: clampBpm(e.target.value) })}
                    className="mt-3 h-2 w-full cursor-pointer accent-jade-600"
                    aria-valuetext={`${prefs.bpm} nhịp mỗi phút`}
                  />
                  <div className="mt-1 flex justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span>Chậm, khoan thai</span>
                    <span>Nhanh</span>
                  </div>
                  <Button variant={running ? 'saffron' : 'primary'} size="lg" className="mt-4 w-full" onClick={toggleRunning}>
                    {running ? <Pause className="h-5 w-5" aria-hidden /> : <Play className="h-5 w-5" aria-hidden />}
                    {running ? 'Tạm dừng' : 'Bắt đầu niệm theo mõ'}
                  </Button>
                </div>
              ) : (
                <div className="w-full max-w-sm rounded-2xl bg-paper-2/80 px-4 py-1 dark:bg-night-3/80">
                  <Switch checked={prefs.mo} onChange={(mo) => setPref({ mo })} label="Gõ mõ mỗi câu" description="Thêm tiếng mõ bên cạnh tiếng hạt chuỗi" />
                </div>
              )}

              {!soundOn && (
                <p className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <VolumeX className="h-4 w-4" aria-hidden />
                  Âm thanh đang tắt trong phần Cá nhân.
                </p>
              )}

              <div className="flex w-full max-w-sm gap-2">
                <Button variant="outline" size="lg" className="flex-1 px-3 text-sm whitespace-nowrap" onClick={resetBeads} disabled={session.bead === 0}>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Đặt lại chuỗi
                </Button>
                <Button variant="secondary" size="lg" className="flex-1 px-3 text-sm whitespace-nowrap" onClick={handleEnd} disabled={session.total === 0}>
                  <Square className="h-4 w-4" aria-hidden />
                  Kết thúc phiên
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6 lg:col-span-5">
          <GoalCard today={todayCount} goal={goal} beadSize={prefs.size} />
          <NiemHistory todayCount={todayCount} />
          <NiemGuide />
        </div>
      </div>

      <MantraPicker open={pickerOpen} onClose={() => setPickerOpen(false)} value={mantra} onChange={changeMantra} />
    </div>
  )
}
