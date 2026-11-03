import { useEffect, useRef } from 'react'
import { beatInterval } from './session'

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/**
 * Gọi onBeat đều đặn theo BPM khi `running`. Dùng setTimeout tự hiệu chỉnh trôi nhịp
 * (setInterval bị lệch dần). Nếu tab bị trình duyệt hãm nhịp thì bỏ qua nhịp lỡ,
 * không dồn nhiều nhịp một lúc (tránh đếm khống).
 */
export function useMetronome({ running, bpm, onBeat, startDelay = 250 }) {
  const live = useRef({ bpm, onBeat })

  useEffect(() => {
    live.current = { bpm, onBeat }
  })

  useEffect(() => {
    if (!running) return undefined
    let timer
    let next = now() + startDelay
    const tick = () => {
      live.current.onBeat?.()
      const t = now()
      next += beatInterval(live.current.bpm)
      if (next <= t) next = t + beatInterval(live.current.bpm)
      timer = setTimeout(tick, next - t)
    }
    timer = setTimeout(tick, startDelay)
    return () => clearTimeout(timer)
  }, [running, startDelay])
}
