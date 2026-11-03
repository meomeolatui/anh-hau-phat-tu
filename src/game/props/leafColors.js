import { Color } from 'three'
import { PALETTE } from '../materials'

/**
 * Màu lá rụng theo màu tán cây: lá rơi phải giống cây phía trên.
 * Cây xanh → chủ yếu lá xanh các sắc độ, lẫn ít lá úa vàng/nâu (lá già tự nhiên).
 * Cây đỏ/vàng/tím → lá cùng tông màu đó.
 */

const DRY_YELLOW = new Color('#c9a64a')
const DRY_BROWN = new Color('#8a6a35')
const cache = new Map()

/** Bảng màu (mảng Color) cho lá rụng của một cây có màu tán `treeColor` */
export function leafPalette(treeColor = PALETTE.leaf) {
  const key = String(treeColor)
  if (cache.has(key)) return cache.get(key)
  const base = new Color(treeColor)
  const palette = [
    // 3 sắc độ cùng màu tán (chiếm phần lớn)
    base.clone().offsetHSL(0, 0, -0.07),
    base.clone(),
    base.clone().offsetHSL(0.015, 0.04, 0.07),
    // ít lá úa (vẫn pha màu gốc để không lạc tông)
    base.clone().lerp(DRY_YELLOW, 0.45),
    base.clone().lerp(DRY_BROWN, 0.55),
  ]
  cache.set(key, palette)
  return palette
}

/** Chọn màu một chiếc lá: 85% màu tán, 15% lá úa */
export function pickLeafColor(rand, palette) {
  const r = rand()
  if (r < 0.85) return palette[Math.floor((r / 0.85) * 3)]
  return palette[r < 0.93 ? 3 : 4]
}

/** Cây gần (x, z) nhất trong danh sách — null nếu danh sách rỗng */
export function nearestTree(trees, x, z) {
  let best = null
  let bestD = Infinity
  for (const t of trees) {
    const d = Math.hypot(t.x - x, t.z - z)
    if (d < bestD) {
      bestD = d
      best = t
    }
  }
  return best
}
