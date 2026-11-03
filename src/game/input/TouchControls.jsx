import { useEffect, useRef, useState } from 'react'
import { ArrowBigUp } from 'lucide-react'
import { runtime } from '../runtime'

/**
 * Điều khiển cảm ứng: cần điều khiển ảo nửa trái, vuốt nửa phải để xoay camera,
 * chụm hai ngón để phóng to/thu nhỏ, nút nhảy góc dưới phải. Chỉ hiện trên thiết bị cảm ứng.
 */
export default function TouchControls({ disabled }) {
  const [isTouch] = useState(() => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches)
  const zoneRef = useRef(null)
  const [stick, setStick] = useState(null) // { x, y, dx, dy } vị trí gốc + độ lệch (px)

  useEffect(() => {
    const el = zoneRef.current
    if (!el || disabled) return
    const RADIUS = 52
    let moveId = null
    let origin = null
    const looks = new Map() // pointerId → {x,y}
    let pinchDist = 0

    const onDown = (e) => {
      if (e.pointerType === 'mouse') return
      // Chạm nút nhảy: không bắt làm cần điều khiển / vuốt camera
      if (e.target instanceof Element && e.target.closest('button')) return
      el.setPointerCapture(e.pointerId)
      const leftHalf = e.clientX < window.innerWidth * 0.45
      if (leftHalf && moveId === null) {
        moveId = e.pointerId
        origin = { x: e.clientX, y: e.clientY }
        setStick({ ...origin, dx: 0, dy: 0 })
      } else {
        looks.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (looks.size === 2) {
          const [a, b] = [...looks.values()]
          pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
        }
      }
    }
    const onMove = (e) => {
      if (e.pointerId === moveId) {
        let dx = e.clientX - origin.x
        let dy = e.clientY - origin.y
        const d = Math.hypot(dx, dy)
        if (d > RADIUS) {
          dx = (dx / d) * RADIUS
          dy = (dy / d) * RADIUS
        }
        runtime.input.moveX = dx / RADIUS
        runtime.input.moveZ = -dy / RADIUS
        runtime.input.run = d > RADIUS * 0.95
        setStick({ ...origin, dx, dy })
        return
      }
      const prev = looks.get(e.pointerId)
      if (!prev) return
      if (looks.size === 2) {
        looks.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const [a, b] = [...looks.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        runtime.input.zoomDelta += (pinchDist - d) / 40
        pinchDist = d
        return
      }
      runtime.input.lookDX += (e.clientX - prev.x) * 1.3
      runtime.input.lookDY += (e.clientY - prev.y) * 1.3
      looks.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    const onUp = (e) => {
      if (e.pointerId === moveId) {
        moveId = null
        runtime.input.moveX = 0
        runtime.input.moveZ = 0
        runtime.input.run = false
        setStick(null)
      }
      looks.delete(e.pointerId)
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [disabled])

  if (!isTouch || disabled) return null

  return (
    <div ref={zoneRef} className="absolute inset-0 z-10 touch-none select-none" aria-hidden>
      {stick ? (
        <div className="pointer-events-none absolute" style={{ left: stick.x - 60, top: stick.y - 60 }}>
          <div className="grid h-[120px] w-[120px] place-items-center rounded-full border-2 border-white/50 bg-black/15 backdrop-blur-sm">
            <div
              className="h-12 w-12 rounded-full bg-white/80 shadow-lg"
              style={{ transform: `translate(${stick.dx}px, ${stick.dy}px)` }}
            />
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-10 left-8 grid h-[110px] w-[110px] place-items-center rounded-full border-2 border-white/30 bg-black/10">
          <div className="h-11 w-11 rounded-full bg-white/40" />
        </div>
      )}
      {/* Nút nhảy (vùng cảm ứng bỏ qua chạm trên nút, xem onDown) */}
      <button
        type="button"
        aria-label="Nhảy"
        onPointerDown={() => {
          runtime.input.jump = true
        }}
        className="absolute right-6 bottom-28 grid h-16 w-16 place-items-center rounded-full border-2 border-white/40 bg-black/20 text-white backdrop-blur-sm active:bg-white/30"
      >
        <ArrowBigUp className="h-7 w-7" aria-hidden />
      </button>
    </div>
  )
}
