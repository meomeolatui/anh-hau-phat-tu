import { useEffect, useRef, useState } from 'react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { runtime } from '../runtime'
import { STAMINA_MAX } from '../stamina'

/**
 * Ngồi ghế đá nghỉ chân: hồi thể lực nhanh. Đứng dậy thì trở lại chỗ trước ghế.
 * params: { benchId, seat, face, standUp }
 */
export default function NghiNgoi({ params, onClose }) {
  const { seat, face, standUp } = params
  useActivityPose({ anim: 'seated', stand: seat, face })
  const fill = useRef(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    runtime.player.resting = true
    let raf = 0
    const tick = () => {
      const pct = (runtime.player.stamina.value / STAMINA_MAX) * 100
      if (fill.current) fill.current.style.width = `${pct}%`
      setFull(pct >= 99.5)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      runtime.player.resting = false
      // Đứng dậy ra trước ghế, chân chạm đất
      if (standUp) runtime.player.position.set(...standUp)
    }
  }, [standUp])

  return (
    <Panel title="Nghỉ chân" subtitle="Ghế đá ven đường" onClose={onClose}>
      <p className="text-sm text-stone-600">Ngồi thở chậm, ngắm mây núi. Thể lực hồi nhanh khi ngồi nghỉ.</p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-label="Thể lực">
        <div ref={fill} className="h-full rounded-full bg-jade-500 transition-[width] duration-150" style={{ width: '0%' }} />
      </div>
      <p className="mt-2 text-xs text-stone-500" aria-live="polite">
        {full ? 'Đã khoẻ lại — sẵn sàng đi tiếp.' : 'Đang hồi sức…'}
      </p>
      <ActionButton className="mt-4 w-full" tone={full ? 'jade' : 'ghost'} onClick={onClose}>
        Đứng dậy đi tiếp
      </ActionButton>
    </Panel>
  )
}
