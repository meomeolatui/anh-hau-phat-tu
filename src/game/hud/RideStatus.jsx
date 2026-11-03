import { useEffect, useRef, useState } from 'react'
import { CableCar, FastForward } from 'lucide-react'
import { runtime } from '../runtime'
import { hurryRide } from '../ride'
import { CABLE_STATIONS } from '../world/layout'

/**
 * Bảng nhỏ khi đang ngồi cáp treo: ga đến, thanh tiến độ (cập nhật thẳng DOM mỗi frame), nút đến ga ngay.
 */
export default function RideStatus() {
  const [to, setTo] = useState(null)
  const fill = useRef(null)

  useEffect(() => {
    let raf = 0
    let last = null
    const tick = () => {
      const ride = runtime.player.ride
      const dest = ride?.to ?? null
      if (dest !== last) {
        last = dest
        setTo(dest)
      }
      if (ride && fill.current) fill.current.style.width = `${Math.min(100, (ride.dist / ride.total) * 100)}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!to) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-3 sm:top-5">
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-stone-900/60 px-4 py-2.5 text-white shadow-xl backdrop-blur-md" role="status">
        <CableCar className="h-5 w-5 shrink-0 text-saffron-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Cáp treo → {CABLE_STATIONS[to]?.name}</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div ref={fill} className="h-full rounded-full bg-saffron-300" style={{ width: '0%' }} />
          </div>
        </div>
        <button type="button" onClick={hurryRide} className="flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1.5 text-xs font-medium hover:bg-white/25">
          <FastForward className="h-3.5 w-3.5" aria-hidden /> Đến ga ngay
        </button>
      </div>
    </div>
  )
}
