import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playBell, haptic } from '../../lib/sound'
import { getBreathPhase, getPattern } from './breathing'
import { elapsedMs, isRunning, pauseClock, resumeClock, startClock } from './clock'
import { bellSchedule, dueBells } from './schedule'
import { MIN_RECORD_SEC } from './summary'

const TICK_MS = 250

/**
 * Điều khiển một buổi ngồi: chuẩn bị → ngồi → xong.
 * Cả buổi là MỘT dòng thời gian [chuẩn bị | ngồi]; giai đoạn được suy ra từ thời gian đã trôi,
 * không cần effect chuyển trạng thái. Mọi con số tính lại từ Date.now() ở mỗi nhịp —
 * setInterval chỉ để vẽ lại màn hình, nên vẫn chính xác khi tab ẩn hay máy ngủ.
 *
 * config: { minutes, prepSec, pattern (id), bells, intervalMin }
 * onComplete(sec): gọi đúng một lần khi buổi ngồi kết thúc (hết giờ, dừng sớm, hoặc rời trang khi đã ngồi ≥ 1 phút).
 */
export default function useMeditationSession(config, onComplete) {
  const totalMs = config.minutes * 60 * 1000
  const prepMs = config.prepSec * 1000
  const pattern = useMemo(() => getPattern(config.pattern), [config.pattern])
  const schedule = useMemo(() => bellSchedule(config.minutes * 60, config.intervalMin), [config.minutes, config.intervalMin])

  const [clock, setClock] = useState(() => startClock(Date.now()))
  const [now, setNow] = useState(() => Date.now())
  const [result, setResult] = useState(null)

  const lastSecRef = useRef(0)
  const startBellRef = useRef(false)
  const doneRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const elapsed = elapsedMs(clock, now)
  const paused = !isRunning(clock)
  const stage = result ? 'done' : elapsed < prepMs ? 'prep' : 'sit'
  const sitMs = result ? result.sec * 1000 : Math.min(totalMs, Math.max(0, elapsed - prepMs))

  // Nhịp vẽ lại màn hình; khi tab quay lại thì cập nhật ngay, không chờ nhịp kế tiếp
  useEffect(() => {
    if (stage === 'done') return
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, TICK_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [stage])

  // Chuông mở đầu — dùng ref để StrictMode chạy effect 2 lần cũng không đánh 2 tiếng
  useEffect(() => {
    if (stage !== 'sit' || startBellRef.current) return
    startBellRef.current = true
    if (config.bells) playBell({ strong: true })
    haptic([30, 60, 30])
  }, [stage, config.bells])

  const complete = useCallback(
    (ms) => {
      if (doneRef.current) return
      doneRef.current = true
      const capped = Math.min(Math.max(0, ms), totalMs)
      const sec = Math.floor(capped / 1000)
      setResult({ sec, natural: capped >= totalMs })
      if (config.bells) playBell({ strong: true })
      haptic([40, 80, 40])
      onCompleteRef.current?.(sec)
    },
    [config.bells, totalMs],
  )

  // Hết giờ & chuông nhắc giữa giờ — đồng bộ với đồng hồ thật sau mỗi nhịp
  useEffect(() => {
    if (stage !== 'sit') return
    if (sitMs >= totalMs) {
      complete(sitMs)
      return
    }
    const sec = Math.floor(sitMs / 1000)
    const due = dueBells(schedule, lastSecRef.current, sec)
    lastSecRef.current = Math.max(lastSecRef.current, sec)
    if (due.length) playBell({ strong: false, pitch: 262 })
  }, [stage, sitMs, totalMs, schedule, complete])

  // Rời trang giữa chừng (nút Back, đổi route): vẫn ghi nhận phần đã ngồi nếu đủ ngưỡng.
  // Dưới ngưỡng thì bỏ qua và KHÔNG khoá doneRef — StrictMode gỡ/gắn lại effect ngay lúc đầu.
  const latestRef = useRef({ clock, prepMs, totalMs })
  useEffect(() => {
    latestRef.current = { clock, prepMs, totalMs }
  }, [clock, prepMs, totalMs])

  useEffect(
    () => () => {
      if (doneRef.current) return
      const { clock: c, prepMs: prep, totalMs: total } = latestRef.current
      const ms = Math.min(total, elapsedMs(c, Date.now()) - prep)
      if (ms < MIN_RECORD_SEC * 1000) return
      doneRef.current = true
      onCompleteRef.current?.(Math.floor(ms / 1000))
    },
    [],
  )

  const pause = useCallback(() => {
    const t = Date.now()
    setClock((c) => pauseClock(c, t))
    setNow(t)
  }, [])

  const resume = useCallback(() => {
    const t = Date.now()
    setClock((c) => resumeClock(c, t))
    setNow(t)
  }, [])

  /** Bỏ qua phần chuẩn bị còn lại: nhảy dòng thời gian tới đúng điểm bắt đầu ngồi. */
  const skipPrep = useCallback(() => {
    const t = Date.now()
    setClock({ accumulatedMs: prepMs, since: t })
    setNow(t)
  }, [prepMs])

  const finish = useCallback(() => {
    if (stage === 'sit') complete(elapsedMs(clock, Date.now()) - prepMs)
  }, [stage, clock, prepMs, complete])

  return {
    stage,
    paused,
    pattern,
    elapsedMs: sitMs,
    remainingMs: Math.max(0, totalMs - sitMs),
    progress: totalMs ? Math.min(1, sitMs / totalMs) : 0,
    prepLeftSec: stage === 'prep' ? Math.max(1, Math.ceil((prepMs - elapsed) / 1000)) : 0,
    phase: stage === 'sit' ? getBreathPhase(pattern, sitMs) : null,
    result,
    pause,
    resume,
    skipPrep,
    finish,
  }
}
