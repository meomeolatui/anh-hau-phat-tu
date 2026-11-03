import { useState } from 'react'
import { CableCar, MapPin } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { cn } from '../../lib/cn'
import { CABLE_STATIONS } from '../world/layout'
import { routeBetween, routeLength, RIDE_SPEED } from '../cableway'
import { startRide } from '../ride'
import { canTravel, stationList } from './capTreoLogic'

/**
 * Cáp treo: chọn ga đến → lên cabin. Cabin chạy thật trên dây (props/Cableway.jsx), nhân vật ngồi
 * trong cabin, camera bám theo; tiến độ & nút "Đến ga ngay" hiện trên HUD (hud/RideStatus.jsx).
 * params: { from }
 */
export default function CapTreo({ params, onClose }) {
  const { from } = params
  useActivityPose({ anim: 'idle' })
  const [to, setTo] = useState(null)
  const stations = stationList(from)
  const fromSt = CABLE_STATIONS[from]

  const board = () => {
    if (!to || !canTravel(from, to)) return
    onClose()
    // Đóng bảng xong mới lên cabin (bảng mở/khoá tư thế riêng)
    requestAnimationFrame(() => startRide(from, to))
  }

  return (
    <Panel title="Cáp treo" subtitle={`${fromSt?.name ?? 'Nhà ga'} · chọn ga đến`} onClose={onClose}>
      <ul className="space-y-2" role="radiogroup" aria-label="Ga đến">
        {stations.map((s) => {
          const legs = !s.current ? routeBetween(from, s.id) : null
          const secs = legs ? Math.round(routeLength(legs) / RIDE_SPEED) : 0
          return (
            <li key={s.id}>
              <button
                type="button"
                role="radio"
                aria-checked={to === s.id}
                disabled={s.current}
                onClick={() => setTo(s.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition',
                  s.current
                    ? 'cursor-default border-stone-200 bg-stone-100 text-stone-400'
                    : to === s.id
                      ? 'border-jade-600 bg-jade-50'
                      : 'border-stone-200 bg-white hover:border-stone-300',
                )}
              >
                <MapPin className={cn('h-5 w-5 shrink-0', s.current ? 'text-stone-400' : 'text-jade-600')} aria-hidden />
                <span className="flex-1">
                  <span className="block font-semibold">{s.name}</span>
                  <span className="text-xs text-stone-500">
                    {s.current ? 'Bạn đang ở đây' : `${legs?.length > 1 ? 'Qua ga Chùa Bà · ' : ''}khoảng ${secs} giây`}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-stone-500">Ngồi trong cabin, kéo chuột hoặc vuốt màn hình để xoay camera ngắm núi rừng.</p>
      <ActionButton className="mt-4 w-full" disabled={!to} onClick={board}>
        <CableCar className="h-5 w-5" /> Lên cabin
      </ActionButton>
    </Panel>
  )
}
