import { nearestWalkable } from './navigation'
import { TERRAIN_GRID, groundSurface } from './terrainGrid'
import { valueNoise } from './noise'

const BOUNDS = TERRAIN_GRID

/** Chọn vị trí mỏm đá: ô lưới dốc (≥ 0,7) hoặc đỉnh cao, cách lối đi ≥ 4 m; xác định, không random */
export function outcropSpots(limit = 420) {
  const out = []
  const step = 3
  for (let z = BOUNDS.z0 + 2; z < BOUNDS.z1 - 2 && out.length < limit; z += step) {
    for (let x = BOUNDS.x0 + 2; x < BOUNDS.x1 - 2 && out.length < limit; x += step) {
      const pick = valueNoise(x * 0.61 + 3.7, z * 0.61 - 1.3)
      if (pick < 0.62) continue
      const jx = x + (valueNoise(x, z + 50) - 0.5) * step
      const jz = z + (valueNoise(x + 50, z) - 0.5) * step
      const y = groundSurface(jx, jz)
      const dx = groundSurface(jx + 1, jz) - groundSurface(jx - 1, jz)
      const dz = groundSurface(jx, jz + 1) - groundSurface(jx, jz - 1)
      const slope = Math.hypot(dx, dz) / 2
      const high = y > 46
      if (slope < 0.7 && !high) continue
      if (high && slope < 0.35 && pick < 0.8) continue
      if (nearestWalkable(jx, jz).dist < 4) continue
      const s = 0.6 + (pick - 0.62) * (high ? 7 : 4.5)
      out.push({
        x: jx,
        y: y - s * 0.25,
        z: jz,
        s,
        ry: valueNoise(jx * 2.3, jz * 2.3) * Math.PI * 2,
        tilt: (valueNoise(jx * 1.7 + 9, jz * 1.7) - 0.5) * 0.5,
        shade: 0.82 + valueNoise(jx * 0.9, jz * 0.9 + 4) * 0.3,
      })
    }
  }
  return out
}
