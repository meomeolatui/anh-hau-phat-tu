import { ZONES, WALKABLES, toWorld } from '../../world/layout'
import { terrainHeight } from '../../world/navigation'
import { hallColliders } from '../../props/colliders'

/**
 * Dữ liệu bố cục khu Chùa Bà (Linh Sơn Tiên Thạch Tự) — thuần JS để test import được.
 * Toạ độ CỤC BỘ quanh O; mặt sân đi được: x ∈ [−33, 33], z ∈ [−28, 28], y = 0.
 *
 * Trục chính x = 0: bậc đá (+Z) → lối lát đá → lư hương lớn → tam cấp → chánh điện (tựa vách núi −Z).
 * Bên phải (+X, phía sau): Điện Bà trong hang đá. Bên trái (−X, phía sau): gác chuông.
 * Ba lối ra: bậc đá xuống (0, 27) · rẽ sang Chùa Hang (−32, −6) · dốc lên đỉnh (22, −27).
 */
export const O = ZONES['chua-ba'].origin
export const w = (p) => toWorld(O, p)

/** Đổi điểm (lx, lz) trong hệ của một công trình {x, z, rot} sang toạ độ cục bộ của zone */
export function at(base, lx, lz) {
  const c = Math.cos(base.rot || 0)
  const s = Math.sin(base.rot || 0)
  return [base.x + lx * c + lz * s, base.z - lx * s + lz * c]
}

/** Ba lối ra phải luôn thông (toạ độ cục bộ x, z) */
export const EXITS = {
  bacDa: [0, 27],
  chuaHang: [-32, -6],
  docLenDinh: [22, -27],
}

/* ---------------- Công trình chính ---------------- */

/** Chánh điện (Phật điện) hai tầng mái, mặt tiền hướng +Z */
export const HALL = { x: 0, z: -20, w: 15, d: 11, h: 4.6, rot: 0 }
/** Mép trước nền chánh điện (cục bộ zone) — tam cấp đặt ngay trước đó */
export const HALL_FRONT_Z = HALL.z + (HALL.d + 1.6) / 2

/** Điện Bà: hang đá tựa vách núi bên phải, mặt hang hơi quay vào giữa sân */
export const DIEN_BA = { x: 15.5, z: -23, rot: -0.2 }
/** Kích thước lòng hang (hệ cục bộ của hang): rộng ±HALF_IN, vách đá dày tới ±HALF_OUT, sâu từ BACK tới MOUTH */
export const CAVE = { halfIn: 2.4, halfOut: 4.6, back: -3.2, mouth: 2.4 }

/** Gác chuông bên trái sân, cân đối với Điện Bà */
export const BELL = { x: -15.5, z: -21, rot: 0.2 }

export const LU_HUONG = [0, -3] // lư hương lớn giữa sân
export const CABLE = { x: 26, z: 16, rotY: -Math.PI / 2 } // ga cáp treo, cửa quay vào sân (−X)

export const TREES = [
  { x: -17, z: 9, scale: 1.15 }, // cây đa cổ thụ
  { x: 17, z: 2, scale: 1, color: '#6aa45a' }, // cây bồ đề
  { x: -26, z: -19, scale: 0.9, color: '#e8b232' }, // cây lá vàng góc sau
  { x: -11.5, z: 12, scale: 0.8, color: '#c8452e' }, // cây lá đỏ cạnh sân lá trái
  { x: 12.5, z: 6.5, scale: 0.8, color: '#e07a2c' }, // cây lá cam cạnh sân lá phải
]
export const BAMBOO = [
  { x: 30.5, z: -12, seed: 5 },
  { x: 30.5, z: 25, seed: 8, height: 7 },
  { x: -30.5, z: 25.5, seed: 12 },
  { x: -30.5, z: -24.5, seed: 17, height: 7 },
]
export const STONE_LANTERNS = [
  [-3.4, LU_HUONG[1]],
  [3.4, LU_HUONG[1]],
  [-4.4, HALL_FRONT_Z + 1],
  [4.4, HALL_FRONT_Z + 1],
  [-3.4, 10],
  [3.4, 10],
  [-3.4, 19],
  [3.4, 19],
  // đánh dấu lối rẽ sang Chùa Hang
  [-30.6, -9.4],
  [-30.6, -2.6],
]
export const FLAGS = [
  [-5.6, 24.5],
  [5.6, 24.5],
]
export const BROOM = { x: 8, z: 11, rotY: -0.5 }

/* ---------------- Đồ có tương tác (cục bộ → thế giới qua w) ---------------- */

const HALL_FLOOR = 0.14
const CAVE_FLOOR = 0.1
const caveAt = (lx, lz) => at(DIEN_BA, lx, lz)

/** Hướng nhìn từ (x,z) về (tx,tz) theo quy ước rotY */
const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z)

const BUDDHA = [HALL.x, HALL.z - 4.2]

export const SPOTS = {
  luHuong: { pos: [LU_HUONG[0], 0, LU_HUONG[1]], rotY: 0, scale: 1.3 },
  huongBanTho: { pos: [HALL.x, HALL_FLOOR, HALL.z - 1.6], rotY: 0, scale: 0.55 },
  // Trục giữa trước tượng Phật: chiếu Lễ Phật (lạy theo nhịp) phía trước, chiếu Qui y hồi hướng (lạy liên tục) ngay phía sau
  altar: { pos: [HALL.x, HALL_FLOOR, HALL.z + 1], rotY: 0 },
  lectern: { pos: [HALL.x - 3, HALL_FLOOR, HALL.z - 1.2], rotY: 0 },
  seats: [
    [-2.8, 1.6],
    [2.8, 1.6],
    [3, -0.6],
  ].map(([lx, lz], i) => {
    const x = HALL.x + lx
    const z = HALL.z + lz
    return { id: `chua-ba-niem-phat-${i + 1}`, pos: [x, HALL_FLOOR, z], rotY: faceTo(x, z, BUDDHA[0], BUDDHA[1]) }
  }),
  huongDienBa: (() => {
    const [x, z] = caveAt(0, -0.4)
    return { pos: [x, CAVE_FLOOR, z], rotY: DIEN_BA.rot, scale: 0.7 }
  })(),
  bell: { pos: [BELL.x, 0, BELL.z], rotY: BELL.rot },
  broom: { pos: [BROOM.x, 0, BROOM.z], rotY: BROOM.rotY },
  truTri: { pos: [2.8, 0.12, HALL.z + HALL.d / 2 - 0.35 + 0.75], rotY: 0 },
  // Bồ đoàn thiền đường (5/15/30/60 phút) bên trái, hướng về tượng Phật
  thien: (() => {
    const [x, z] = [HALL.x - 5.2, HALL.z + 0.4]
    return { pos: [x, HALL_FLOOR, z], rotY: faceTo(x, z, BUDDHA[0], BUDDHA[1]) }
  })(),
  layLienTuc: { pos: [HALL.x, HALL_FLOOR, HALL.z + 3.2], rotY: 0 },
  phatTu: { pos: [4.2, 0, LU_HUONG[1] + 2], rotY: -Math.PI / 2 },
}

export const LEAF_FIELDS = [
  { id: 'chua-ba-san-trai', center: [-16, 0, 9], w: 13, d: 9, count: 50, seed: 31 },
  { id: 'chua-ba-san-phai', center: [15, 0, 3], w: 12, d: 9, count: 45, seed: 47 },
]

/** Điểm đứng của người chơi khi dùng từng đồ (cục bộ x, z) — dùng cho test bố cục */
function front([x, , z], rotY, dist) {
  return [x + Math.sin(rotY) * dist, z + Math.cos(rotY) * dist]
}
export const STAND_POINTS = {
  luHuong: front(SPOTS.luHuong.pos, 0, 1.6 * SPOTS.luHuong.scale + 0.4),
  huongBanTho: front(SPOTS.huongBanTho.pos, 0, 1.6 * SPOTS.huongBanTho.scale + 0.4),
  huongDienBa: front(SPOTS.huongDienBa.pos, SPOTS.huongDienBa.rotY, 1.6 * SPOTS.huongDienBa.scale + 0.4),
  altar: [SPOTS.altar.pos[0], SPOTS.altar.pos[2]],
  thien: [SPOTS.thien.pos[0], SPOTS.thien.pos[2]],
  layLienTuc: [SPOTS.layLienTuc.pos[0], SPOTS.layLienTuc.pos[2]],
  lectern: front(SPOTS.lectern.pos, SPOTS.lectern.rotY, 1.1),
  bell: front(SPOTS.bell.pos, SPOTS.bell.rotY, 2.2),
  cable: front([CABLE.x, 0, CABLE.z], CABLE.rotY, 4.2),
  broom: [BROOM.x + Math.sin(BROOM.rotY) * 1.2, BROOM.z + Math.cos(BROOM.rotY) * 1.2],
  ...Object.fromEntries(SPOTS.seats.map((s) => [s.id, [s.pos[0], s.pos[2]]])),
}

/* ---------------- Vách núi sau sân ---------------- */

const DOC_1 = WALKABLES.find((s) => s.id === 'doc-1')

/** Khoảng cách (m) từ điểm thế giới tới tâm đường dốc lên đỉnh */
function distToDoc1(x, z) {
  const [ax, az] = DOC_1.from
  const [bx, bz] = DOC_1.to
  const vx = bx - ax
  const vz = bz - az
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)))
  return Math.hypot(x - ax - vx * t, z - az - vz * t)
}

/**
 * Vách núi dựng phía −Z: các phiến đá granite cao (sx, sy, sz = nửa kích thước) ngoài mép sân,
 * tránh đường dốc lên đỉnh. Chân đá vùi theo địa hình phía trước (terrainHeight) để không lơ lửng.
 */
export const CLIFF_ROCKS = (() => {
  const out = []
  const rows = [
    { z: -28.6, step: 5, sx: [2.6, 3.6], sy: [5, 7.5], sz: [1.8, 2.4], sink: 0.4 },
    { z: -33, step: 7, sx: [3.8, 5], sy: [8, 11], sz: [2.6, 3.2], sink: 0.8 },
  ]
  rows.forEach((row, ri) => {
    for (let x = -37 + ri * 3, i = 0; x <= 38; x += row.step, i++) {
      const k = ((i * 7 + ri * 3) % 5) / 4 // biến thiên xác định 0..1
      const k2 = ((i * 3 + ri) % 4) / 3
      const sx = row.sx[0] + (row.sx[1] - row.sx[0]) * k
      const sy = row.sy[0] + (row.sy[1] - row.sy[0]) * k2
      const sz = row.sz[0] + (row.sz[1] - row.sz[0]) * (1 - k)
      const rot = ((i % 3) - 1) * 0.25
      const z = row.z - sz - Math.abs(Math.sin(rot)) * sx - (i % 2) * 0.6
      const [wx, , wz] = toWorld(O, [x, 0, z])
      if (distToDoc1(wx, wz) < DOC_1.width / 2 + Math.max(sx, sz) + 1) continue
      const ground = terrainHeight(wx, wz + sz) - O[1] // chân phía trước (gần sân, thấp hơn)
      out.push({ x, y: ground - row.sink + sy * 0.6, z, sx, sy, sz, rot })
    }
  })
  return out
})()

/* ---------------- Vật cản (cục bộ zone) ---------------- */

const caveBox = (lx, lz, bw, bd) => {
  const [x, z] = caveAt(lx, lz)
  return { type: 'box', x, z, w: bw, d: bd, rot: DIEN_BA.rot }
}
const sideW = CAVE.halfOut - CAVE.halfIn
const sideD = CAVE.mouth - CAVE.back

export const COLLIDERS = [
  // Chánh điện: tường + cột hiên (mặt tiền mở)
  ...hallColliders({ w: HALL.w, d: HALL.d, x: HALL.x, z: HALL.z, rot: HALL.rot }),
  { type: 'box', x: HALL.x, z: HALL.z - 4, w: 5.4, d: 1.8 }, // bệ thờ + tượng Phật
  { type: 'box', x: HALL.x, z: HALL.z - 2.6, w: 3.2, d: 0.9 }, // hương án
  { type: 'circle', x: HALL.x - 4, z: HALL.z - 4.2, r: 0.75 }, // tượng Bồ Tát trái
  { type: 'circle', x: HALL.x + 4, z: HALL.z - 4.2, r: 0.75 }, // tượng Bồ Tát phải
  { type: 'circle', x: SPOTS.huongBanTho.pos[0], z: SPOTS.huongBanTho.pos[2], r: 0.42 }, // lư hương bàn thờ
  // Điện Bà: hai vách đá, vách sau, bàn thờ, hai trụ cửa hang
  caveBox(-(CAVE.halfIn + sideW / 2), (CAVE.back + CAVE.mouth) / 2, sideW, sideD),
  caveBox(CAVE.halfIn + sideW / 2, (CAVE.back + CAVE.mouth) / 2, sideW, sideD),
  caveBox(0, CAVE.back - 0.4, CAVE.halfIn * 2, 0.8),
  caveBox(0, -2.45, 3.2, 1.5),
  { type: 'circle', ...xz(caveAt(-2.1, CAVE.mouth - 0.4)), r: 0.3 },
  { type: 'circle', ...xz(caveAt(2.1, CAVE.mouth - 0.4)), r: 0.3 },
  { type: 'circle', x: SPOTS.huongDienBa.pos[0], z: SPOTS.huongDienBa.pos[2], r: 0.5 },
  // Gác chuông
  { type: 'box', x: BELL.x, z: BELL.z, w: 3.2, d: 3.2, rot: BELL.rot },
  // Lư hương lớn
  { type: 'circle', x: LU_HUONG[0], z: LU_HUONG[1], r: 1 },
  // Ga cáp treo (thân ga 7.4 × 6.4, xoay −90°)
  { type: 'box', x: CABLE.x, z: CABLE.z, w: 7.4, d: 6.4, rot: CABLE.rotY },
  // Cây, trúc, đèn đá, cột cờ, giá chổi
  ...TREES.map((t) => ({ type: 'circle', x: t.x, z: t.z, r: 0.9 * t.scale })),
  ...BAMBOO.map((b) => ({ type: 'circle', x: b.x, z: b.z, r: 1.1 })),
  ...STONE_LANTERNS.map(([x, z]) => ({ type: 'circle', x, z, r: 0.3 })),
  ...FLAGS.map(([x, z]) => ({ type: 'circle', x, z, r: 0.25 })),
  { type: 'box', x: BROOM.x, z: BROOM.z, w: 1.7, d: 0.35, rot: BROOM.rotY },
]

function xz([x, z]) {
  return { x, z }
}
