import { nearestWalkable, terrainHeight } from './navigation'
import { fbm } from './noise'

/**
 * Lưới địa hình hiển thị — NGUỒN DUY NHẤT cho Terrain.jsx (dựng mesh) và các zone cần đặt đồ
 * đúng mặt lưới (groundSurface). Đổi độ phân giải lưới chỉ cần sửa ở đây.
 * Mỗi ô vuông chia 2 tam giác, đường chéo xen kẽ: (i+j) chẵn → chéo b–c, lẻ → chéo a–d.
 */
export const TERRAIN_GRID = { x0: -175, x1: 155, z0: -335, z1: 95, cell: 2 }

const GRID = TERRAIN_GRID

/**
 * Gồ ghề chi tiết chỉ để hiển thị (mét, luôn ≥ 0): nhiều tầng nhiễu, mạnh hơn ở sườn cao,
 * tắt hẳn trong vòng 2,5 m quanh mặt đi được → lối đi, sân chùa không đổi.
 * Chỉ NÂNG mặt đất (không hạ) để cây/đá đặt theo terrainHeight không bị lơ lửng (cùng lắm lún nhẹ).
 */
export function terrainDetail(x, z, walkDist = nearestWalkable(x, z)?.dist ?? Infinity) {
  if (walkDist <= 2.5) return 0
  const t = Math.min(1, (walkDist - 2.5) / 6)
  const fade = t * t * (3 - 2 * t)
  const n = fbm(x, z, 12, 3)
  return fade * n * 0.75
}

const gridCache = new Map()

/** Độ cao đỉnh lưới (i, j) — đúng giá trị đỉnh mesh địa hình */
export function gridHeight(i, j) {
  const key = i * 4096 + j
  let h = gridCache.get(key)
  if (h === undefined) {
    const x = GRID.x0 + i * GRID.cell
    const z = GRID.z0 + j * GRID.cell
    h = terrainHeight(x, z) + terrainDetail(x, z)
    gridCache.set(key, h)
  }
  return h
}

/**
 * Độ cao của mặt lưới địa hình hiển thị tại (x,z) — nội suy trên đúng tam giác của Terrain.jsx,
 * nên đồ vật đặt ngoài mặt đi được không lơ lửng / chìm ở chỗ sườn dốc.
 */
export function groundSurface(x, z) {
  if (x < GRID.x0 || x >= GRID.x1 || z < GRID.z0 || z >= GRID.z1) return terrainHeight(x, z)
  const fx = (x - GRID.x0) / GRID.cell
  const fz = (z - GRID.z0) / GRID.cell
  const i = Math.floor(fx)
  const j = Math.floor(fz)
  const u = fx - i
  const v = fz - j
  const ha = gridHeight(i, j)
  const hb = gridHeight(i + 1, j)
  const hc = gridHeight(i, j + 1)
  const hd = gridHeight(i + 1, j + 1)
  if ((i + j) % 2 === 0) {
    // đường chéo b–c
    return u + v <= 1 ? ha + (hb - ha) * u + (hc - ha) * v : hd + (hc - hd) * (1 - u) + (hb - hd) * (1 - v)
  }
  // đường chéo a–d
  return u >= v ? ha + (hb - ha) * u + (hd - hb) * v : ha + (hc - ha) * v + (hd - hc) * u
}
