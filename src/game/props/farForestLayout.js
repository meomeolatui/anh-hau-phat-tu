import { TERRAIN_GRID, groundSurface } from '../world/terrainGrid'
import { nearestWalkable } from '../world/navigation'
import { pickGroveColor } from './groveLayout'
import { seeded } from '../../lib/random'

/**
 * Rừng xa phủ đều khắp vùng quanh núi (thuần JS, test được):
 * lưới đều có xô lệch ngẫu nhiên → nhìn từ xa thấy rừng dày, đều, không lốm đốm chỗ trống.
 * - Ngoài lưới địa hình: đặt trên đồng bằng (độ cao PLAIN_Y).
 * - Trong lưới địa hình: chỉ ở xa lối đi (> 20 m), bám mặt lưới.
 */

/** Tâm và bán kính vùng phủ rừng (sương mù che dần từ ~400 m) */
export const FAR_CENTER = [0, -120]
export const FAR_RADIUS = 470
/** Độ cao mặt đồng bằng phía ngoài lưới địa hình (khớp mặt phẳng nền trong Terrain.jsx) */
export const PLAIN_Y = -0.6

const insideGrid = (x, z) => x >= TERRAIN_GRID.x0 && x < TERRAIN_GRID.x1 && z >= TERRAIN_GRID.z0 && z < TERRAIN_GRID.z1

/**
 * @param {{ spacing?: number, seed?: number }} opts spacing: khoảng cách lưới (m) — nhỏ hơn = dày hơn
 * @returns [{ x, y, z, scale, rot, color }]
 */
export function farForest({ spacing = 9, seed = 7 } = {}) {
  const rand = seeded(seed)
  const [cx, cz] = FAR_CENTER
  const out = []
  for (let x = cx - FAR_RADIUS; x <= cx + FAR_RADIUS; x += spacing) {
    for (let z = cz - FAR_RADIUS; z <= cz + FAR_RADIUS; z += spacing) {
      const px = x + (rand() - 0.5) * spacing * 0.9
      const pz = z + (rand() - 0.5) * spacing * 0.9
      const r1 = rand()
      const r2 = rand()
      const r3 = rand()
      const r4 = rand()
      if (Math.hypot(px - cx, pz - cz) > FAR_RADIUS) continue
      let y = PLAIN_Y
      if (insideGrid(px, pz)) {
        // Trong vùng núi: chỉ lấp chỗ xa lối đi; ven đường đã có rừng/rặng cây riêng
        if (nearestWalkable(px, pz).dist < 20) continue
        y = groundSurface(px, pz)
        // Đỉnh trơ đá: thưa cây
        if (y > 48 && r1 < 0.7) continue
      }
      out.push({
        x: px,
        y: y - 0.2,
        z: pz,
        scale: 0.85 + r2 * 0.75,
        rot: r3 * Math.PI * 2,
        // 40% cây xanh làm nền, còn lại đủ màu như rặng cây gần
        color: r4 < 0.4 ? (r4 < 0.2 ? '#4f8a49' : '#5f9a52') : pickGroveColor((r4 - 0.4) / 0.6),
      })
    }
  }
  return out
}
