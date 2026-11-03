import { POLE_R, decorColliders, shiftDecor } from '../../props/decorKinds'
import { O as CH_O, buildChuaHangDecor } from '../chua-hang/data'
import { O1, O2, REST, VIEW, buildDuongNuiDecor } from './data'
import { groundSurface, placeAt, rampFrame, slopeY, walkDist } from './helpers'

/**
 * Đồ trang trí khu Đường bậc đá & đường lên đỉnh (props/decor.jsx) — thuần JS, test: zones/decor-layout.test.js.
 *  - CN1_DECOR (cục bộ O1) và CN2_DECOR (cục bộ O2): đồ trên/quanh hai chiếu nghỉ; món trên mặt sân có vật cản.
 *  - RAMP_DECOR (toạ độ thế giới): dọc các đoạn bậc — dây phướn, đèn lồng dây vắt ngang bậc, cổng phụ, bia nhỏ,
 *    bonsai/chậu cây; tất cả đặt NGOÀI mặt đi được (slope) nên không cần vật cản.
 * Không đặt nơi thờ tự trên đường bậc.
 */

/** Một món trên sườn (toạ độ thế giới), y bám mặt địa hình */
export const onSlope = (it, reach = 0.5) => ({ ...it, y: slopeY(it.x, it.z, reach), slope: true })

/** Cây, đá, đèn đá, cột lan can sẵn có ven các đoạn dốc (thế giới) — đồ mới phải né */
const OBSTACLES = (() => {
  const d = buildDuongNuiDecor()
  const c = buildChuaHangDecor()
  const [hx, , hz] = CH_O
  return [
    ...[...d.trees, ...c.trees].map((t) => [t.x, t.z, 0.45 * t.s]),
    ...[...d.rocks, ...c.rocks].map((r) => [r.x, r.z, 0.6 * r.s]),
    ...[...d.lanterns, ...c.lanterns].map((l) => [l.x, l.z, 0.3]),
    ...[...d.rails, ...c.rails].flat().map(([x, , z]) => [x, z, 0.14]),
    ...[...d.bamboo, ...d.bigTrees].map(([x, , z]) => [x, z, 0.9]),
    ...c.bamboo.map(([x, , z]) => [x + hx, z + hz, 0.9]),
  ]
})()

/** Chỗ (x,z) bán kính r còn trống: không đè cây/đá/lan can và nằm hẳn ngoài mặt đi được */
const isClear = (x, z, r) => walkDist(x, z) > r + 0.1 && OBSTACLES.every(([ox, oz, or]) => Math.hypot(ox - x, oz - z) > or + r + 0.15)

/** Dịch t quanh giá trị mong muốn (±0,15) tới chỗ đầu tiên thoả `ok` */
function nudge(t, ok) {
  for (let k = 0; k <= 20; k++) {
    const tt = t + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.0075
    if (tt > 0 && tt < 1 && ok(tt)) return tt
  }
  return t
}

/** Món treo vắt ngang đường dốc tại tỉ lệ ~t: hai cột ở hai bên, cách mép `off` mét */
export function across(id, t, kind, h, off = 1.4) {
  const f = rampFrame(id)
  const half = f.s.width / 2 + off
  const tt = nudge(t, (u) => isClear(...xz(f.at(u, -half)), POLE_R) && isClear(...xz(f.at(u, half)), POLE_R))
  const [x, , z] = f.at(tt, -half)
  const [x2, , z2] = f.at(tt, half)
  return { kind, x, y: groundSurface(x, z), z, x2, y2: groundSurface(x2, z2), z2, h, slope: true }
}

/** Món treo chạy dọc một bên đường dốc từ ~t0 tới ~t1 */
export function along(id, t0, t1, side, kind, h, off = 1.4) {
  const f = rampFrame(id)
  const o = side * (f.s.width / 2 + off)
  const a = nudge(t0, (u) => isClear(...xz(f.at(u, o)), POLE_R))
  const b = nudge(t1, (u) => isClear(...xz(f.at(u, o)), POLE_R))
  const [x, , z] = f.at(a, o)
  const [x2, , z2] = f.at(b, o)
  return { kind, x, y: groundSurface(x, z), z, x2, y2: groundSurface(x2, z2), z2, h, slope: true }
}

/** Món đặt bên đường dốc (~t, side, khoảng lệch khỏi mép), mặt quay vào lối đi; reach = bán kính chiếm chỗ */
export function beside(id, t, side, it, off = 1.9, reach = 0.55) {
  const f = rampFrame(id)
  const o = side * (f.s.width / 2 + off)
  const tt = nudge(t, (u) => isClear(...xz(f.at(u, o)), reach))
  const [x, , z] = f.at(tt, o)
  const [cx, , cz] = f.at(tt, 0)
  return onSlope({ ...it, x, z, rot: Math.atan2(cx - x, cz - z) })
}

/** Cổng phụ vắt ngang đường dốc tại ~t: hai trụ ngoài mép dốc, đủ cao so với mặt bậc */
export function rampGate(id, t, off = 0.9) {
  const f = rampFrame(id)
  const half = f.s.width / 2 + off
  const tt = nudge(t, (u) => isClear(...xz(f.at(u, -half)), 0.3) && isClear(...xz(f.at(u, half)), 0.3))
  const [cx, cy, cz] = f.at(tt, 0)
  const [ax, , az] = f.at(tt, -half)
  const [bx, , bz] = f.at(tt, half)
  const [dx, , dz] = f.at(Math.min(1, tt + 0.05), 0)
  const y = Math.min(groundSurface(ax, az), groundSurface(bx, bz), cy) - 0.1
  // mặt cổng quay xuống dốc; trục x cục bộ của cổng vắt ngang lối đi
  const rot = Math.atan2(cx - dx, cz - dz)
  return { kind: 'sideGate', x: cx, y, z: cz, rot, w: Math.hypot(bx - ax, bz - az) - 0.4, h: 3.2 + (cy - y), slope: true }
}

const xz = ([x, , z]) => [x, z]

/* ---------------- Chiếu nghỉ 1 (cục bộ O1) ---------------- */

// Chuông gió hai góc mái phía nam nhà nghỉ (xa chỗ bác Ba Hên ngồi)
const [chimeAx, chimeAz] = placeAt(REST, -2.0, 1.45)
const [chimeBx, chimeBz] = placeAt(REST, -2.0, -1.45)

export const CN1_DECOR = [
  { kind: 'bonsai', x: -8.4, z: 2.6, stand: 'stone', v: 1 },
  { kind: 'pottedPlant', x: 6.4, z: -5.5, v: 1 },
  { kind: 'pottedPlant', x: 6.2, z: 5.8, v: 2, color: '#f6d33c' },
  { kind: 'firewood', x: 8.2, z: -3.4, rot: Math.PI / 2 },
  { kind: 'windChime', x: chimeAx, y: 2.85, z: chimeAz },
  { kind: 'windChime', x: chimeBx, y: 2.85, z: chimeBz, v: 1 },
]

/* ---------------- Chiếu nghỉ 2 (cục bộ O2) ---------------- */

// Chuông gió ở hai góc mái trước của đình (cách bồ đoàn thiền > 2.5 m)
const [c2ax, c2az] = placeAt(VIEW, -2.05, 2.05)
const [c2bx, c2bz] = placeAt(VIEW, 2.05, 2.05)

export const CN2_DECOR = [
  { kind: 'windChime', x: c2ax, y: 2.65, z: c2az, v: 1 },
  { kind: 'windChime', x: c2bx, y: 2.65, z: c2bz },
]

/* ---------------- Dọc các đoạn bậc (toạ độ thế giới, ngoài mặt đi được) ---------------- */

export const RAMP_DECOR = [
  // Bậc đoạn 1: dây phướn vắt ngang (cả hai đầu chiếu nghỉ 1), bia nhỏ, bonsai đón ở đầu chiếu nghỉ
  across('bac-1', 0.35, 'flagLine', 5),
  across('bac-1', 0.7, 'flagLine', 5),
  across('bac-1', 0.97, 'flagLine', 5),
  across('bac-2', 0.1, 'flagLine', 5),
  beside('bac-1', 0.22, -1, { kind: 'miniStele' }),
  beside('bac-1', 0.92, -1, { kind: 'bonsai', stand: 'stone', v: 2 }, 1.2),
  beside('bac-1', 0.92, 1, { kind: 'bonsai', stand: 'stone', v: 3 }, 1.2),
  // Bậc đoạn 2 (lên chùa Bà): ba chuỗi đèn lồng vắt ngang, chậu cây đón khách ở đầu sân chùa
  across('bac-2', 0.3, 'stringLights', 4.2),
  across('bac-2', 0.6, 'stringLights', 4.2),
  across('bac-2', 0.86, 'stringLights', 4.2),
  beside('bac-2', 0.9, -1, { kind: 'pottedPlant', v: 0 }, 1.3),
  beside('bac-2', 0.9, 1, { kind: 'pottedPlant', v: 0 }, 1.3),
  // Dốc lên đỉnh đoạn 1: cổng phụ, dây phướn dọc hai bên, bia nhỏ
  rampGate('doc-1', 0.2),
  along('doc-1', 0.32, 0.62, -1, 'flagLine', 4.5),
  along('doc-1', 0.32, 0.62, 1, 'flagLine', 4.5),
  beside('doc-1', 0.75, 1, { kind: 'miniStele' }),
  // Chiếu nghỉ 2 → dốc đoạn 2: dây phướn và đèn lồng vắt ngang
  across('doc-2', 0.18, 'flagLine', 4.6),
  across('doc-2', 0.6, 'stringLights', 4.2),
  beside('doc-2', 0.4, -1, { kind: 'pottedPlant', v: 3 }, 1.4),
  beside('doc-2', 0.82, -1, { kind: 'bonsai', stand: 'stone', v: 1 }, 1.2),
  beside('doc-2', 0.82, 1, { kind: 'bonsai', stand: 'stone', v: 2 }, 1.2),
]

/** Mọi món của khu (toạ độ thế giới) — một DecorSet duy nhất */
export const DECOR_WORLD = [...shiftDecor(CN1_DECOR, O1), ...shiftDecor(CN2_DECOR, O2), ...RAMP_DECOR]

export const CN1_DECOR_COLLIDERS = decorColliders(CN1_DECOR)
export const CN2_DECOR_COLLIDERS = decorColliders(CN2_DECOR)
