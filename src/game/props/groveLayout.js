import { WALKABLES } from '../world/layout'
import { nearestWalkable, shapeDistance } from '../world/navigation'
import { groundSurface } from '../world/terrainGrid'
import { seeded } from '../../lib/random'

/**
 * Bố trí rặng cây màu quanh từng khu vực (thuần JS, test được).
 * Cây mọc trên sườn đất ngoài mặt đi được, cách mép 2.5–22 m — không chắn lối đi.
 */

/** Hệ số mật độ: người dùng muốn rừng quanh chùa dày gấp 3 */
export const GROVE_DENSITY = 3
const MAX_DIST = 22

/** Bảng màu tán: chủ yếu đỏ/cam/vàng (lá phong, phượng, muồng), có hồng, tím; ít cây xanh làm nền */
export const GROVE_COLORS = [
  { color: '#c8452e', weight: 4 }, // đỏ
  { color: '#a8322b', weight: 2 }, // đỏ thẫm
  { color: '#e07a2c', weight: 3 }, // cam
  { color: '#e8b232', weight: 4 }, // vàng
  { color: '#d6c23c', weight: 2 }, // vàng chanh
  { color: '#e58aa8', weight: 1.5 }, // hồng
  { color: '#9b6bc4', weight: 1.5 }, // tím bằng lăng
  { color: '#5f9a52', weight: 2 }, // xanh
]

const TOTAL = GROVE_COLORS.reduce((s, c) => s + c.weight, 0)

export function pickGroveColor(r) {
  let acc = 0
  for (const c of GROVE_COLORS) {
    acc += c.weight / TOTAL
    if (r <= acc) return c.color
  }
  return GROVE_COLORS[0].color
}

/**
 * Sinh danh sách cây quanh các mặt đi được của `zoneId`.
 * @returns [{ x, y, z, scale, rot, color }] toạ độ THẾ GIỚI
 */
export function groveFor(zoneId, { count: baseCount = 26, seed = 1, density = GROVE_DENSITY } = {}) {
  const shapes = WALKABLES.filter((s) => s.zone === zoneId)
  if (!shapes.length) return []
  const count = Math.round(baseCount * density)
  const rand = seeded(seed * 97 + zoneId.length * 13)
  const trees = []
  let tries = 0
  while (trees.length < count && tries < count * 40) {
    tries++
    const s = shapes[Math.floor(rand() * shapes.length)]
    // Điểm ngẫu nhiên quanh hình (theo bao hình chữ nhật nới rộng)
    let cx
    let cz
    let half
    if (s.type === 'ramp') {
      const t = rand()
      cx = s.from[0] + (s.to[0] - s.from[0]) * t
      cz = s.from[1] + (s.to[1] - s.from[1]) * t
      half = s.width / 2 + MAX_DIST
    } else if (s.type === 'circle') {
      cx = s.cx
      cz = s.cz
      half = s.r + MAX_DIST
    } else {
      cx = s.cx
      cz = s.cz
      half = Math.max(s.w, s.d) / 2 + MAX_DIST
    }
    const x = cx + (rand() * 2 - 1) * half
    const z = cz + (rand() * 2 - 1) * half
    const own = shapeDistance(s, x, z).dist
    const any = nearestWalkable(x, z).dist
    if (own < 2.5 || own > MAX_DIST || any < 2.5) continue
    // Không mọc sát nhau quá
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.8)) continue
    trees.push({
      x,
      y: groundSurface(x, z) - 0.15,
      z,
      scale: 0.75 + rand() * 0.55,
      rot: rand() * Math.PI * 2,
      color: pickGroveColor(rand()),
    })
  }
  return trees
}
