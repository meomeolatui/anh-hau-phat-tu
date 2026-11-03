import { ZONES } from '../../world/layout'
import { hallColliders } from '../../props/colliders'
import { seeded } from '../../../lib/random'
import {
  groundSurface,
  placeAt,
  rampLanterns,
  rampRails,
  rampScatter,
  ringRails,
  ringScatter,
  walkableById,
  worldColliders,
} from '../duong-nui/helpers'

/**
 * Dữ liệu khu Chùa Hang — Linh Sơn Long Châu Tự (thuần JS — test import được).
 * Gốc O = tâm sân tròn r 15 (y 22). Lối vào từ chùa Bà ở phía +X (điểm vào cục bộ ≈ (14, 0)).
 * Vách đá granite dựng phía −X/−Z; khe suối chảy ngoài mép sân phía +Z.
 * Góc "deg" đo theo atan2(z, x) trên mặt phẳng XZ cục bộ.
 */

export const O = ZONES['chua-hang'].origin
const san = walkableById('san-chua-hang')
export const R = san.r

const polar = (deg, r) => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r]

/* ---------------- Điện nhỏ nép vách đá ---------------- */

/** Điện quay mặt về tâm sân (mặt tiền +Z cục bộ của Hall) */
export const HALL = { x: -4, z: -9, w: 8, d: 6, h: 3, rot: Math.atan2(4, 9) }
export const hallAt = (lx, lz) => placeAt(HALL, lx, lz)

/** Bàn thờ sát tường hậu (cục bộ của điện) */
export const ALTAR_TABLE = { lz: -2.1, w: 2.6, d: 0.9, h: 0.9 }
export const FLOOR = 0.14
const INCENSE_LOCAL = [0, -1.15]
const ALTAR_SPOT_LOCAL = [0, 1.3]
const SEAT_LOCAL = [-2.4, 0.2]
/** Đèn đá hai bên thềm điện (cục bộ của điện) */
export const HALL_LANTERNS_LOCAL = [
  [-3.3, 4.6],
  [3.3, 4.6],
]

/* ---------------- Hang đá ---------------- */

/** Cửa hang ngay mép sân phía tây, quay vào tâm sân */
export const CAVE_DEG = 192
const [cvx, cvz] = polar(CAVE_DEG, R + 0.06)
export const CAVE = { x: cvx, z: cvz, rot: Math.atan2(-cvx, -cvz) }

/* ---------------- "Ông Đá nứt" (tương truyền) ---------------- */

/** Tảng đá nứt đôi ven sân phía nam; khe ~1,5 m theo hướng bán kính, đi xuyên qua được */
export const SPLIT_DEG = 70
const [spx, spz] = polar(SPLIT_DEG, 10.5)
export const SPLIT = { x: spx, z: spz, rot: Math.atan2(spx, spz), gap: 1.5, halfW: 1.0, len: 3.2 }
const splitHalfX = SPLIT.gap / 2 + SPLIT.halfW

/* ---------------- Đồ khác trên sân ---------------- */

export const ENTRY_LANTERNS = [
  [12.2, -3.8],
  [11.8, 4.4],
]
export const BODHI = { x: 8.2, z: -8.6, scale: 0.85 }
export const NPC_CHU_TU = { x: 2.4, z: -3.6, rotY: Math.atan2(11.6, 3.6) }

export const COLLIDERS = [
  ...hallColliders(HALL),
  (() => {
    const [x, z] = hallAt(0, ALTAR_TABLE.lz)
    return { type: 'box', x, z, w: ALTAR_TABLE.w, d: ALTAR_TABLE.d, rot: HALL.rot } // bàn thờ
  })(),
  (() => {
    const [x, z] = hallAt(...INCENSE_LOCAL)
    return { type: 'circle', x, z, r: 0.35 } // lư hương bàn thờ
  })(),
  ...HALL_LANTERNS_LOCAL.map(([lx, lz]) => {
    const [x, z] = hallAt(lx, lz)
    return { type: 'circle', x, z, r: 0.3 }
  }),
  ...ENTRY_LANTERNS.map(([x, z]) => ({ type: 'circle', x, z, r: 0.3 })),
  { type: 'circle', x: BODHI.x, z: BODHI.z, r: 0.8 }, // cây bồ đề
  { type: 'circle', x: NPC_CHU_TU.x, z: NPC_CHU_TU.z, r: 0.3 }, // chú Tư
  // Hai nửa Ông Đá nứt — khe giữa để trống
  ...[-1, 1].map((s) => {
    const [x, z] = placeAt(SPLIT, s * splitHalfX, 0)
    return { type: 'box', x, z, w: SPLIT.halfW * 2, d: SPLIT.len, rot: SPLIT.rot }
  }),
  // Hai khối đá hai bên cửa hang (lấn nhẹ vào mép sân)
  ...[-1, 1].map((s) => {
    const [x, z] = placeAt(CAVE, s * 2.7, -0.4)
    return { type: 'circle', x, z, r: 1.35 }
  }),
]

/* ---------------- Đồ có tương tác (toạ độ thế giới) ---------------- */

const wpt = ([x, z], y = 0) => [O[0] + x, O[1] + y, O[2] + z]

export const INTERACTIVE = {
  incense: { position: wpt(hallAt(...INCENSE_LOCAL), FLOOR), rotY: HALL.rot },
  altar: { position: wpt(hallAt(...ALTAR_SPOT_LOCAL), FLOOR), rotY: HALL.rot },
  // Bồ đoàn quay về phía bàn thờ
  seat: {
    position: wpt(hallAt(...SEAT_LOCAL), FLOOR),
    rotY: HALL.rot + Math.atan2(-SEAT_LOCAL[0], ALTAR_TABLE.lz - SEAT_LOCAL[1]),
  },
  npc: { position: wpt([NPC_CHU_TU.x, NPC_CHU_TU.z]), rotY: NPC_CHU_TU.rotY },
}

export const COLLIDER_GROUPS = [{ key: 'chua-hang', list: COLLIDERS, origin: O }]

export function allWorldColliders() {
  return COLLIDER_GROUPS.flatMap((g) => worldColliders(g.list, g.origin))
}

/* ---------------- Vách đá (cục bộ O) ---------------- */

/**
 * Khối đá granite lớn chồng lên nhau tạo vách & khung cửa hang.
 * Mỗi khối: { x, y, z, sx, sy, sz, rx, ry, rz, dark } — dodecahedron bán kính 1 được co giãn.
 */
export function buildCliff() {
  const rand = seeded(1830)
  const rocks = []
  for (let a = 126; a <= 300; a += 11) {
    if (Math.abs(a - CAVE_DEG) < 9) continue
    const sx = 3.4 + rand() * 1.6
    const sy = 4.5 + rand() * 3
    const sz = 2.8 + rand() * 1.4
    // Mép trong của khối đá nằm ngoài mép sân
    const r = R + 0.3 + sz * 0.95 + sx * 0.15
    const [x, z] = polar(a, r)
    const ry = Math.atan2(-x, -z) + (rand() - 0.5) * 0.3
    rocks.push({ x, y: sy * 0.55 - 2, z, sx, sy, sz, rx: (rand() - 0.5) * 0.16, ry, rz: (rand() - 0.5) * 0.16, dark: rand() < 0.4 })
  }
  // Lớp trên lùi vào trong núi
  for (let a = 131; a <= 296; a += 15) {
    const s = 2.6 + rand() * 1.4
    const [x, z] = polar(a, R + 4.5 + s * 0.6)
    rocks.push({ x, y: 5.2 + rand() * 2.4, z, sx: s * 1.2, sy: s, sz: s, rx: rand(), ry: rand() * 6, rz: rand() * 0.3, dark: rand() < 0.5 })
  }
  // Khung cửa hang: hai trụ đá, đá đỉnh, đá phủ lưng hang (cục bộ của cửa hang → cục bộ zone)
  const cave = [
    { l: [-2.7, 1.5, -0.9], s: [1.5, 2.6, 2.2], dark: true },
    { l: [2.7, 1.5, -0.9], s: [1.5, 2.6, 2.2], dark: false },
    { l: [0, 4.1, -0.9], s: [3.8, 1.3, 2.4], dark: false },
    { l: [0, 5.9, -2.6], s: [4.2, 2.4, 3.2], dark: true },
    { l: [0, 2.0, -4.6], s: [3.6, 3.4, 1.6], dark: false },
    { l: [-2.4, 3.6, -3.0], s: [1.6, 2.2, 2.4], dark: false },
    { l: [2.4, 3.6, -3.0], s: [1.6, 2.2, 2.4], dark: true },
  ]
  for (const c of cave) {
    const [x, z] = placeAt(CAVE, c.l[0], c.l[2])
    rocks.push({ x, y: c.l[1], z, sx: c.s[0], sy: c.s[1], sz: c.s[2], rx: 0.05, ry: CAVE.rot + 0.2, rz: 0.04, dark: c.dark })
  }
  return rocks
}

/* ---------------- Khe suối (cục bộ O) ---------------- */

/** Đường tâm khe nước: bắt nguồn dưới chân vách (tây nam), chảy vòng ngoài mép sân rồi đổ xuống sườn */
const STREAM_PATH = [
  [130, 16.4],
  [118, 16.6],
  [104, 16.8],
  [90, 17.0],
  [77, 17.6],
  [66, 18.8],
  [58, 21],
  [52, 24],
  [48, 28],
].map(([deg, r]) => polar(deg, r))

export const STREAM_WIDTH = 1.1

/**
 * Mẫu dọc khe nước cách nhau ~0,6 m: { x, y, z, nx, nz, s } (cục bộ O; s = quãng đường).
 * y bám mặt lưới địa hình (lấy điểm cao nhất trên bề ngang khe để mặt nước không chìm).
 */
export function streamSamples(step = 0.6) {
  const out = []
  let s = 0
  for (let i = 0; i < STREAM_PATH.length - 1; i++) {
    const [ax, az] = STREAM_PATH[i]
    const [bx, bz] = STREAM_PATH[i + 1]
    const len = Math.hypot(bx - ax, bz - az)
    const n = Math.max(1, Math.round(len / step))
    const last = i === STREAM_PATH.length - 2
    for (let k = 0; k < n + (last ? 1 : 0); k++) {
      const t = k / n
      const x = ax + (bx - ax) * t
      const z = az + (bz - az) * t
      const nx = -(bz - az) / len
      const nz = (bx - ax) / len
      const hw = STREAM_WIDTH / 2
      const ys = [0, -hw, hw].map((o) => groundSurface(O[0] + x + nx * o, O[2] + z + nz * o))
      out.push({ x, y: Math.max(...ys) - O[1] + 0.14, z, nx, nz, s: s + len * t })
    }
    s += len
  }
  return out
}

/** Khoảng cách (mặt bằng) từ điểm cục bộ tới đường tâm suối */
export function distToStream(x, z) {
  let best = Infinity
  for (let i = 0; i < STREAM_PATH.length - 1; i++) {
    const [ax, az] = STREAM_PATH[i]
    const [bx, bz] = STREAM_PATH[i + 1]
    const vx = bx - ax
    const vz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)))
    best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t))
  }
  return best
}

/* ---------------- Trang trí quanh sân & lối vào (toạ độ THẾ GIỚI) ---------------- */

export function buildChuaHangDecor() {
  const rails = [
    ...rampRails('loi-chua-hang'),
    // Lan can quanh mép sân, chừa phía vách đá và chỗ nối lối vào
    ...ringRails(O, R + 0.45, -60, 125, 8),
  ]
  const lanterns = rampLanterns('loi-chua-hang', { every: 8, phase: 1 })
  const { trees, rocks } = rampScatter('loi-chua-hang', 977)
  const avoidStream = (x, z) => distToStream(x - O[0], z - O[2]) < 2.2
  trees.push(...ringScatter([O[0], O[2]], { rMin: R + 3, rMax: R + 14, deg0: -70, deg1: 122, count: 26, seed: 1995, clear: 2.6, avoid: avoidStream }))
  // Đá cuội hai bờ suối (cục bộ O)
  const rand = seeded(42)
  const bank = []
  streamSamples(1.5).forEach((p, i) => {
    const side = i % 2 ? 1 : -1
    const s = 0.35 + rand() * 0.4
    const off = side * (STREAM_WIDTH / 2 + 0.2 + s * 0.3)
    const x = p.x + p.nx * off
    const z = p.z + p.nz * off
    bank.push({ x, y: groundSurface(O[0] + x, O[2] + z) - O[1] - 0.05, z, s, rot: rand() * 6 })
  })
  const bambooLocal = [
    [-13.6, 10.4],
    [17.2, -6.8],
    [16.4, 9.6],
  ]
  const bamboo = bambooLocal.map(([x, z]) => [x, groundSurface(O[0] + x, O[2] + z) - O[1], z])
  return { rails, lanterns, trees, rocks, bank, bamboo }
}
