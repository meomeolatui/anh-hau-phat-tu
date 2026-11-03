import { useEffect, useRef } from 'react'
import { Footprints } from 'lucide-react'
import { runtime } from '../runtime'
import { STAMINA_MAX } from '../stamina'

/**
 * Thanh thể lực: đọc runtime mỗi frame và sửa thẳng DOM (không render lại React 60 lần/giây).
 * Xanh khi khoẻ → vàng khi mệt → đỏ nhấp nháy khi kiệt sức.
 */
export default function StaminaBar() {
  const fill = useRef(null)
  const label = useRef(null)
  const wrap = useRef(null)

  useEffect(() => {
    let raf = 0
    let last = -1
    let lastEx = null
    const tick = () => {
      const { value, exhausted } = runtime.player.stamina
      const v = Math.round(value)
      if (v !== last || exhausted !== lastEx) {
        last = v
        lastEx = exhausted
        const pct = (value / STAMINA_MAX) * 100
        if (fill.current) {
          fill.current.style.width = `${pct}%`
          fill.current.style.background = exhausted ? '#ef4444' : pct > 50 ? '#4bb399' : pct > 25 ? '#f9b324' : '#f0920c'
        }
        if (label.current) label.current.textContent = exhausted ? 'Kiệt sức — nghỉ chân đã' : `Thể lực ${v}`
        if (wrap.current) {
          wrap.current.setAttribute('aria-valuenow', String(v))
          wrap.current.classList.toggle('animate-pulse', exhausted)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={wrap}
      role="progressbar"
      aria-label="Thể lực"
      aria-valuemin={0}
      aria-valuemax={STAMINA_MAX}
      aria-valuenow={100}
      className="mt-2 w-fit rounded-2xl bg-stone-900/45 px-3 py-1.5 text-white shadow-lg backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <Footprints className="h-3.5 w-3.5 text-jade-300" aria-hidden />
        <span ref={label} className="text-[11px] font-medium">
          Thể lực 100
        </span>
      </div>
      <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-white/20 sm:w-48">
        <div ref={fill} className="h-full rounded-full transition-[width] duration-150" style={{ width: '100%', background: '#4bb399' }} />
      </div>
    </div>
  )
}
