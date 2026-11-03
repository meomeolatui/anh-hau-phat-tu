import { WALKABLES } from '../../world/layout'
import { shapeDistance } from '../../world/navigation'
import { seeded } from '../../../lib/random'

/**
 * Hàm thuần JS dùng chung cho các zone men theo đường dốc (DuongNui, ChuaHang):
 * độ cao mặt lưới địa hình, lan can đá dọc ramp/quanh sân tròn, đèn đá, cây & đá ven đường.
 * Mọi toạ độ trả về là toạ độ THẾ GIỚI (trừ khi ghi khác).
 */

/* ---------------- Độ cao mặt địa hình đã dựng lưới ---------------- */

// Dùng chung với Terrain.jsx (world/terrainGrid.js) — không chép thông số lưới
import { groundSurface } from '../../world/terrainGrid'

export { groundSurface }

/** Khoảng cách tới mặt đi được gần nhất (âm = đang ở trên mặt đi được) */
export function walkDist(x, z) {
  let best = Infinity
  for (const s of WALKABLES) best = Math.min(best, shapeDistance(s, x, z).dist)
  return best
}

export function walkableById(id) {
  const s = WALKABLES.find((w) => w.id === id)
  if (!s) throw new Error(`Không có mặt đi được "${id}"`)
  return s
}

/**
 * Độ cao đặt chân cho đồ trên sườn: thấp nhất trong các điểm quanh tâm (bán kính `reach`)
 * → món đồ hơi lún vào phía dốc lên thay vì lơ lửng ở phía dốc xuống.
 */
export function slopeY(x, z, reach = 0.5) {
  let y = groundSurface(x, z)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    y = Math.min(y, groundSurface(x + Math.cos(a) * reach, z + Math.sin(a) * reach))
  }
  return y
}

/* ---------------- Toạ độ & vật cản ---------------- */

/** Điểm (lx, lz) trong hệ cục bộ của một vật đặt tại {x, z, rot} (rot theo quy ước rotation.y) */
export function placeAt({ x, z, rot = 0 }, lx, lz) {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return [x + lx * c + lz * s, z - lx * s + lz * c]
}

/** Đổi danh sách vật cản cục bộ sang thế giới — y hệt useColliders (để test với stepMove) */
export function worldColliders(list, [ox, oy, oz]) {
  return list.map((c) => ({ y0: oy, y1: oy + 6, ...c, x: c.x + ox, z: c.z + oz }))
}

/** Cột của nhà nghỉ / đình nhỏ lùi vào trong mép nền bao nhiêu mét (dùng chung với Pavilion) */
export const PILLAR_INSET = 0.3

/** Vật cản 4 cột của nhà nghỉ (Pavilion) đặt tại {x, z, w, d, rot} — toạ độ cục bộ của zone */
export function pavilionColliders({ x, z, w, d, rot = 0 }) {
  const out = []
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const [px, pz] = placeAt({ x, z, rot }, sx * (w / 2 - PILLAR_INSET), sz * (d / 2 - PILLAR_INSET))
      out.push({ type: 'circle', x: px, z: pz, r: 0.3 })
    }
  }
  return out
}

/* ---------------- Lan can đá ---------------- */

/** Tách dãy cột thành các đoạn liền nhau, bỏ cột rơi vào mặt đi được (chỗ nối sân/đường khác) */
function splitRuns(points, clear) {
  const runs = []
  let cur = []
  for (const p of points) {
    if (walkDist(p[0], p[2]) >= clear) {
      cur.push(p)
    } else if (cur.length) {
      runs.push(cur)
      cur = []
    }
  }
  if (cur.length) runs.push(cur)
  return runs
}

/** Khung toạ độ dọc một đường dốc: at(t, off) → [x, y, z] (t 0..1 dọc dốc, off lệch ngang, m) */
export function rampFrame(id) {
  const s = walkableById(id)
  const [ax, az, ay] = s.from
  const [bx, bz, by] = s.to
  const len = Math.hypot(bx - ax, bz - az)
  const ux = (bx - ax) / len
  const uz = (bz - az) / len
  return {
    s,
    len,
    // điểm tại tỉ lệ t dọc dốc, lệch ngang `off` mét (độ cao = độ cao bậc tại đó)
    at: (t, off) => [ax + (bx - ax) * t - uz * off, ay + (by - ay) * t, az + (bz - az) * t + ux * off],
  }
}

/** Lan can hai bên một đường dốc: danh sách các đoạn, mỗi đoạn là dãy cột [x,y,z] */
export function rampRails(id, { spacing = 2.4, inset = 0.3, clear = 0.25 } = {}) {
  const f = rampFrame(id)
  const n = Math.max(2, Math.round(f.len / spacing))
  const runs = []
  for (const side of [-1, 1]) {
    const pts = Array.from({ length: n + 1 }, (_, k) => f.at(k / n, side * (f.s.width / 2 + inset)))
    runs.push(...splitRuns(pts, clear))
  }
  return runs
}

/** Lan can theo cung tròn quanh sân tròn: tâm [x,y,z], bán kính r, góc (độ, đo theo atan2(z,x)) */
export function ringRails([cx, cy, cz], r, deg0, deg1, stepDeg = 10, clear = 0.25) {
  const pts = []
  for (let a = deg0; a <= deg1 + 1e-6; a += stepDeg) {
    const rad = (a * Math.PI) / 180
    pts.push([cx + Math.cos(rad) * r, cy, cz + Math.sin(rad) * r])
  }
  return splitRuns(pts, clear)
}

/* ---------------- Đèn đá, cây, đá tảng ven đường ---------------- */

/** Đèn đá cách đều, so le hai bên đường dốc */
export function rampLanterns(id, { every = 9, offset = 1.0, phase = 0 } = {}) {
  const f = rampFrame(id)
  const n = Math.max(1, Math.floor(f.len / every))
  const out = []
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n
    const side = (k + phase) % 2 === 0 ? -1 : 1
    const [x, , z] = f.at(t, side * (f.s.width / 2 + offset))
    if (walkDist(x, z) < 0.5) continue
    out.push({ x, y: groundSurface(x, z), z, rot: Math.atan2(-side, 0) })
  }
  return out
}

function treeKind(y, r) {
  if (y > 35) return r < 0.55 ? 'thong' : 'tron'
  return r < 0.35 ? 'cao' : r < 0.6 ? 'thong' : 'tron'
}

/** Cây rừng + đá granite sát hai mép đường dốc (xác định theo seed) */
export function rampScatter(id, seed, { treeEvery = 5, rockEvery = 6 } = {}) {
  const f = rampFrame(id)
  const rand = seeded(seed)
  const half = f.s.width / 2
  const trees = []
  const rocks = []
  for (const side of [-1, 1]) {
    const nt = Math.max(1, Math.round(f.len / treeEvery))
    for (let k = 0; k < nt; k++) {
      const t = (k + 0.2 + rand() * 0.6) / nt
      const [x, , z] = f.at(t, side * (half + 2.4 + rand() * 3.6))
      const r = rand()
      if (walkDist(x, z) < 2.2) continue
      const y = groundSurface(x, z)
      trees.push({ x, y: y - 0.15, z, s: 0.75 + rand() * 0.5, rot: rand() * Math.PI * 2, kind: treeKind(y, r) })
    }
    const nr = Math.max(1, Math.round(f.len / rockEvery))
    for (let k = 0; k < nr; k++) {
      const t = (k + rand()) / nr
      const s = 0.6 + rand() * 1.1
      const [x, , z] = f.at(t, side * (half + 0.9 + rand() * 1.8))
      if (walkDist(x, z) < 0.6 * s + 0.15) continue
      rocks.push({ x, y: groundSurface(x, z) - 0.1, z, s, rot: rand() * Math.PI * 2 })
    }
  }
  return { trees, rocks }
}

/**
 * Cây rải quanh một sân tròn: tâm [x,z], bán kính rMin..rMax, trong cung deg0..deg1 (độ).
 * avoid(x,z) → true để bỏ qua vị trí (vd. lòng suối).
 */
export function ringScatter([cx, cz], { rMin, rMax, deg0 = 0, deg1 = 360, count, seed, clear = 2.4, avoid }) {
  const rand = seeded(seed)
  const out = []
  for (let i = 0; i < count * 3 && out.length < count; i++) {
    const a = ((deg0 + rand() * (deg1 - deg0)) * Math.PI) / 180
    const r = rMin + rand() * (rMax - rMin)
    const x = cx + Math.cos(a) * r
    const z = cz + Math.sin(a) * r
    const kr = rand()
    const s = 0.8 + rand() * 0.5
    const rot = rand() * Math.PI * 2
    if (walkDist(x, z) < clear || avoid?.(x, z)) continue
    const y = groundSurface(x, z)
    out.push({ x, y: y - 0.15, z, s, rot, kind: treeKind(y, kr) })
  }
  return out
}
