import { WALKABLES } from '../world/layout'
import { nearestWalkable, shapeDistance } from '../world/navigation'
import { groveFor } from './groveLayout'
import { seeded } from '../../lib/random'

/**
 * Vị trí đèn ban đêm (thuần JS, test được):
 *  - Đèn lan can: dọc hai bên mọi đường bậc/dốc, quanh chiếu nghỉ, sân chùa Bà, chùa Hang, vành đỉnh núi
 *    (sân chân núi là chợ — không có lan can — chỉ có đèn ở đường bậc).
 *  - Đèn lồng treo trên cây: cây trong rặng cây màu gần lối đi.
 */

/** Đèn đặt ngay ngoài mép mặt đi được (chỗ lan can), không chắn đường */
const EDGE_OUT = 0.35
const SPACING = 4.2

/** Có phải điểm ngay mép ngoài một mặt đi được, và không nằm trong mặt đi được khác (chỗ nối/lối vào) */
function onRailLine(x, z) {
  return nearestWalkable(x, z).dist > 0.15
}

/** @returns [{ x, y, z }] toạ độ thế giới chân cột đèn */
export function railingLamps() {
  const out = []
  for (const s of WALKABLES) {
    if (s.zone === 'chan-nui') continue
    if (s.type === 'ramp') {
      const [ax, az, ay] = s.from
      const [bx, bz, by] = s.to
      const len = Math.hypot(bx - ax, bz - az)
      const nx = -(bz - az) / len
      const nz = (bx - ax) / len
      const n = Math.max(2, Math.floor(len / SPACING))
      for (let i = 0; i <= n; i++) {
        const t = i / n
        for (const side of [-1, 1]) {
          const off = s.width / 2 + EDGE_OUT
          const x = ax + (bx - ax) * t + nx * off * side
          const z = az + (bz - az) * t + nz * off * side
          if (onRailLine(x, z)) out.push({ x, y: ay + (by - ay) * t, z })
        }
      }
    } else if (s.type === 'circle') {
      const r = s.r + EDGE_OUT
      const n = Math.max(6, Math.floor((2 * Math.PI * r) / (SPACING + 1)))
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const x = s.cx + Math.cos(a) * r
        const z = s.cz + Math.sin(a) * r
        if (onRailLine(x, z)) out.push({ x, y: s.y, z })
      }
    } else {
      // rect (sân chùa Bà): bốn cạnh
      const hw = s.w / 2 + EDGE_OUT
      const hd = s.d / 2 + EDGE_OUT
      const edges = [
        [-hw, -hd, hw, -hd],
        [hw, -hd, hw, hd],
        [hw, hd, -hw, hd],
        [-hw, hd, -hw, -hd],
      ]
      for (const [x0, z0, x1, z1] of edges) {
        const len = Math.hypot(x1 - x0, z1 - z0)
        const n = Math.floor(len / (SPACING + 1))
        for (let i = 0; i <= n; i++) {
          const x = s.cx + x0 + ((x1 - x0) * i) / n
          const z = s.cz + z0 + ((z1 - z0) * i) / n
          if (onRailLine(x, z) && shapeDistance(s, x, z).dist < 0.6) out.push({ x, y: s.y, z })
        }
      }
    }
  }
  return out
}

/** Thông số rặng cây ở từng zone — PHẢI khớp các <ColorGrove zoneId count seed /> trong src/game/zones */
export const GROVE_MOUNTS = [
  { zoneId: 'chan-nui', count: 36, seed: 11 },
  { zoneId: 'duong-bac-da', count: 44, seed: 23 },
  { zoneId: 'chua-ba', count: 28, seed: 37 },
  { zoneId: 'chua-hang', count: 16, seed: 41 },
  { zoneId: 'dinh-nui', count: 22, seed: 53 },
]

const LANTERN_COLORS = ['#e8402e', '#f2b134', '#e8402e', '#f07a3a']

/**
 * Đèn lồng treo trên cây gần lối đi (≤ 9 m từ mép): khoảng một nửa số cây, mỗi cây 2–3 chiếc
 * treo dưới mép tán. `s` là tỉ lệ cây như ColorGrove truyền cho Forest (scale × 1.3).
 * @returns [{ x, y, z, color, phase }] — y là điểm treo (đầu dây)
 */
export function treeLanterns() {
  const rand = seeded(909)
  const out = []
  for (const g of GROVE_MOUNTS) {
    for (const t of groveFor(g.zoneId, { count: g.count, seed: g.seed })) {
      if (nearestWalkable(t.x, t.z).dist > 9 || rand() < 0.45) continue
      const s = t.scale * 1.3
      const n = 2 + (rand() < 0.4 ? 1 : 0)
      for (let i = 0; i < n; i++) {
        const a = t.rot + (i / n) * Math.PI * 2 + rand() * 0.6
        const r = 1.3 * s
        out.push({
          x: t.x + Math.cos(a) * r,
          y: t.y + 2.5 * s,
          z: t.z + Math.sin(a) * r,
          color: LANTERN_COLORS[Math.floor(rand() * LANTERN_COLORS.length)],
          phase: rand() * Math.PI * 2,
        })
      }
    }
  }
  return out
}
