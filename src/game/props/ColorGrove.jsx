import { useMemo } from 'react'
import { useGame } from '../state'
import { groveFor } from './groveLayout'
import { Forest } from './nature'

/**
 * Rặng cây nhiều màu quanh một khu vực — vẽ bằng Forest instanced (tán nhiều cụm, cành, rễ, đốm hoa, gió).
 * Mỗi cây MỘT tông màu (màu từ groveLayout làm màu tán chính); dáng loài chọn theo màu (speciesForColor).
 */
export default function ColorGrove({ zoneId, count = 26, seed = 1 }) {
  const quality = useGame((s) => s.save.settings.quality)
  const items = useMemo(
    () => groveFor(zoneId, { count, seed }).map((t) => ({ x: t.x, y: t.y, z: t.z, s: t.scale * 1.3, rot: t.rot, color: t.color })),
    [zoneId, count, seed],
  )
  if (!items.length) return null
  return (
    <group name={`grove-${zoneId}`}>
      <Forest items={items} castShadow={quality !== 'low'} />
    </group>
  )
}
