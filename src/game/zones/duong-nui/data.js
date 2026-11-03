import { ZONES } from '../../world/layout'
import {
  groundSurface,
  pavilionColliders,
  placeAt,
  rampLanterns,
  rampRails,
  rampScatter,
  ringRails,
  ringScatter,
  walkableById,
  worldColliders,
} from './helpers'

/**
 * Dữ liệu khu "Đường bậc đá & đường lên đỉnh" (thuần JS — test import được).
 * Ba cụm có gốc toạ độ riêng vì nằm ở ba độ cao khác nhau:
 *  - O1: chiếu nghỉ 1 (= origin của zone 'duong-bac-da'), y 16
 *  - O2: chiếu nghỉ 2 trên đường lên đỉnh, y 40
 *  - GATE_O: cổng gỗ chỉ đường ở chân bậc đoạn 1, y 0
 * Đồ dọc các đoạn bậc (lan can, đèn đá, cây, đá) trải qua nhiều độ cao → toạ độ thế giới.
 */

export const O1 = ZONES['duong-bac-da'].origin
const cn2 = walkableById('chieu-nghi-2')
export const O2 = [cn2.cx, cn2.y, cn2.cz]
export const GATE_O = [0, 0, -25.5]

export const RAMP_IDS = ['bac-1', 'bac-2', 'doc-1', 'doc-2']

/* ---------------- Cổng gỗ chân bậc (cục bộ GATE_O) ---------------- */

export const GATE = { halfW: 4.3, h: 3.6 }
export const GATE_COLLIDERS = [-1, 1].map((s) => ({ type: 'circle', x: s * GATE.halfW, z: 0, r: 0.3 }))

/* ---------------- Chiếu nghỉ 1 (cục bộ O1) ---------------- */
// Lối đi xuyên qua chiếu nghỉ theo trục z (|x| ≤ 3.5) — không đặt vật cản ở đó.

/** Nhà nghỉ chân mái ngói bên phải lối, mặt mở quay vào lối đi (−X) */
export const REST = { x: 6.4, z: 0, w: 4.4, d: 3.2, rot: -Math.PI / 2 }
/** Ghế đá trong nhà nghỉ (cục bộ của nhà nghỉ: sát hàng cột sau) */
export const REST_BENCH = { lz: -1.1, len: 3.0 }
// Hai ghế đá bên trái lối là ghế ngồi được (world/benches.js: chieu-nghi-1a, chieu-nghi-1b) — tự có vật cản
export const WATER_JAR = { x: 8.6, z: 3.0 }
export const CN1_LANTERNS = [
  [-4.0, 8.2],
  [4.0, 8.2],
  [-4.0, -8.2],
  [4.0, -8.2],
]
export const NPC_NGHI_CHAN = { x: 6.6, z: 1.0, rotY: -Math.PI / 2 }

const [rbx, rbz] = placeAt(REST, 0, REST_BENCH.lz)

export const CN1_COLLIDERS = [
  ...pavilionColliders(REST),
  { type: 'box', x: rbx, z: rbz, w: REST_BENCH.len, d: 0.6, rot: REST.rot }, // ghế đá trong nhà nghỉ
  { type: 'circle', x: NPC_NGHI_CHAN.x, z: NPC_NGHI_CHAN.z, r: 0.3 }, // bác Ba Hên
  { type: 'circle', x: WATER_JAR.x, z: WATER_JAR.z, r: 0.45 }, // lu nước
  ...CN1_LANTERNS.map(([x, z]) => ({ type: 'circle', x, z, r: 0.3 })),
]

/* ---------------- Chiếu nghỉ 2 (cục bộ O2) ---------------- */
// Đường đi nối doc-1 (vào ở (−2,5)) với doc-2 (ra ở (−5,−5)) chiếm nửa phía tây; nửa đông nhìn ra vực.

/** Hướng nhìn ra vực: ngược phía tâm núi */
export const VIEW_ROT = Math.atan2(O2[0] - 0, O2[2] - -238)
/** Đình nghỉ nhỏ quay mặt ra vực */
export const VIEW = { x: 3.4, z: 0.6, w: 2.8, d: 2.8, rot: VIEW_ROT }
export const VIEW_BENCH = { lz: -1.0, len: 1.6 }
export const VIEW_SEAT = placeAt(VIEW, 0, 0.3)
export const CN2_BOULDER = { x: 5.6, z: -3.2, s: 1.8 }

const [vbx, vbz] = placeAt(VIEW, 0, VIEW_BENCH.lz)

export const CN2_COLLIDERS = [
  ...pavilionColliders(VIEW),
  { type: 'box', x: vbx, z: vbz, w: VIEW_BENCH.len, d: 0.5, rot: VIEW.rot },
  { type: 'circle', x: CN2_BOULDER.x, z: CN2_BOULDER.z, r: 1.0 },
]

/* ---------------- Đồ có tương tác (toạ độ thế giới) ---------------- */

const w1 = ([x, y, z]) => [O1[0] + x, O1[1] + y, O1[2] + z]
const w2 = ([x, y, z]) => [O2[0] + x, O2[1] + y, O2[2] + z]

export const INTERACTIVE = {
  npcNghiChan: { position: w1([NPC_NGHI_CHAN.x, 0, NPC_NGHI_CHAN.z]), rotY: NPC_NGHI_CHAN.rotY },
  seatThien: { position: w2([VIEW_SEAT[0], 0, VIEW_SEAT[1]]), rotY: VIEW_ROT },
}

/** Mọi nhóm vật cản của zone (key, danh sách cục bộ, gốc) */
export const COLLIDER_GROUPS = [
  { key: 'duong-nui-cong', list: GATE_COLLIDERS, origin: GATE_O },
  { key: 'duong-nui-chieu-nghi', list: CN1_COLLIDERS, origin: O1 },
  { key: 'duong-nui-chieu-nghi-2', list: CN2_COLLIDERS, origin: O2 },
]

export function allWorldColliders() {
  return COLLIDER_GROUPS.flatMap((g) => worldColliders(g.list, g.origin))
}

/* ---------------- Trang trí dọc đường (toạ độ thế giới) ---------------- */

const at = (x, z) => [x, groundSurface(x, z), z]

/** Tính một lần (useMemo) — lan can, đèn đá, cây rừng, đá granite, khóm trúc */
export function buildDuongNuiDecor() {
  const rails = [
    ...RAMP_IDS.flatMap((id) => rampRails(id)),
    // Lan can quanh mép hai chiếu nghỉ (tự chừa chỗ nối với đường bậc)
    ...ringRails(O1, 9.9, 90, 450, 10),
    ...ringRails(O2, 7.4, -60, 110, 12),
  ]
  const lanterns = RAMP_IDS.flatMap((id, i) => rampLanterns(id, { every: 9, phase: i }))
  const trees = []
  const rocks = []
  RAMP_IDS.forEach((id, i) => {
    const r = rampScatter(id, 101 + i * 17)
    trees.push(...r.trees)
    rocks.push(...r.rocks)
  })
  trees.push(...ringScatter([O1[0], O1[2]], { rMin: 11.5, rMax: 19, count: 14, seed: 311 }))
  // Chiếu nghỉ 2: chừa cung nhìn ra vực (quanh hướng VIEW_ROT) không trồng cây
  const viewDeg = (Math.atan2(Math.cos(VIEW_ROT), Math.sin(VIEW_ROT)) * 180) / Math.PI
  trees.push(...ringScatter([O2[0], O2[2]], { rMin: 9, rMax: 15, deg0: viewDeg + 55, deg1: viewDeg + 305, count: 9, seed: 523 }))
  const bamboo = [at(-6.6, -40), at(7.2, -57), at(-7.4, -96), at(11.6, -84), at(-11.2, -72), at(32.5, -171)]
  const bigTrees = [at(12.5, -82), at(-12.8, -84.5), at(51, -209.5)]
  return { rails, lanterns, trees, rocks, bamboo, bigTrees }
}
