import { CABLE_STATIONS, ZONES, toWorld } from '../../world/layout'
import { terrainHeight } from '../../world/navigation'
import { seeded } from '../../../lib/random'

/**
 * Dữ liệu bố cục khu ĐỈNH NÚI BÀ ĐEN (toạ độ CỤC BỘ quanh origin, đơn vị mét) — thuần JS để test được.
 *
 * Mặt đi được: hình tròn bán kính 34 m quanh (0,0), y = 0 cục bộ.
 * Người chơi lên từ đường dốc ở mép +X/+Z, tới quảng trường ở (20,16).
 * Trục chính: lư hương ở tâm (0,0) → chiếu lễ → bàn thờ & bậc cấp → bệ tượng ở (0,−21); tượng nhìn về +Z.
 * Góc `deg` trong file này: x = r·cos, z = r·sin (0° = +X, 90° = +Z).
 */

export const ZONE_ID = 'dinh-nui'
export const O = ZONES[ZONE_ID].origin
export const PLAZA_R = 34
export const ENTRY = [20, 16]

const rad = (deg) => (deg * Math.PI) / 180
const polar = (r, deg) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))]

/* ---------------- Tượng Phật Bà Tây Bổ Đà Sơn ---------------- */

/**
 * Bệ bát giác ba tầng + đài sen + tượng. Tượng thật cao 72 m (gồm đài sen và bệ), đúc từ hơn 170 tấn đồng đỏ;
 * trong game thu nhỏ còn ~24 m (tượng + đài sen) trên bệ đá 3,4 m.
 * r: bán kính ngoại tiếp của bát giác (đỉnh), apothem = r·cos(π/8) là khoảng cách tới mặt phẳng.
 */
export const STATUE = {
  x: 0,
  z: -21,
  size: 20, // chiều cao tượng không gồm đài sen (StandingBodhisattva) → tổng ~24 m
  tiers: [
    { r: 9.5, h: 1.0 },
    { r: 8.1, h: 1.1 },
    { r: 6.9, h: 1.3 },
  ],
}
export const APOTHEM = Math.cos(Math.PI / 8)
export const STATUE_TOP = STATUE.tiers.reduce((s, t) => s + t.h, 0)
/** Bậc cấp trang trí trước tầng bệ dưới cùng (tính từ tâm tượng, theo +Z) */
export const FRONT_STEPS = { from: STATUE.tiers[0].r * APOTHEM, run: 2.0, width: 5 }
/** Bàn thờ đá nối liền chân bậc cấp */
export const ALTAR_TABLE = { w: 3.2, d: 0.9, h: 0.95 }
const altarFrontZ = STATUE.z + FRONT_STEPS.from + FRONT_STEPS.run + ALTAR_TABLE.d // ≈ −9.3
export const ALTAR_TABLE_Z = altarFrontZ - ALTAR_TABLE.d / 2

/* ---------------- Đồ có tương tác ---------------- */

export const INCENSE = { x: 0, z: 0, scale: 1.4, rotY: 0 }
/** Điểm đứng thắp hương (IncenseSpot: 1.6·scale + 0.4 m trước lư) */
export const INCENSE_STAND = [INCENSE.x, INCENSE.z + 1.6 * INCENSE.scale + 0.4]
/** Chiếu lạy trước bàn thờ (AltarSpot rotY = 0: người lạy nhìn về −Z, về phía tượng) */
export const ALTAR_MAT = { x: 0, z: altarFrontZ + 1.7, rotY: 0 }

/** Thiền đài ngắm mây ở mép tây: sàn gỗ + mái che nhẹ, bồ đoàn quay mặt ra vực (−X) */
export const DECK = { x: -24.5, z: 6, w: 9, d: 9, h: 0.12 }
export const DECK_POSTS = [
  [-28.6, 1.9],
  [-28.6, 10.1],
  [-20.4, 1.9],
  [-20.4, 10.1],
]
export const SEATS = [3.6, 6, 8.4].map((z, i) => ({ id: `dinh-nui-thien-${i + 1}`, x: -27.2, z, rotY: -Math.PI / 2 }))

/** Án thư tụng kinh ở góc trái phía trước bệ; mặt trước quay ra quảng trường nên người tụng nhìn về tượng */
export const LECTERN = { x: -10, z: -8, rotY: Math.atan2(-10, 13) }
export const LECTERN_STAND = [LECTERN.x + Math.sin(LECTERN.rotY) * 1.1, LECTERN.z + Math.cos(LECTERN.rotY) * 1.1]

/** Ga cáp treo: vị trí lấy từ layout, cửa ga quay vào tâm quảng trường */
const stationWorld = CABLE_STATIONS[ZONE_ID].position
const stationX = stationWorld[0] - O[0]
const stationZ = stationWorld[2] - O[2]
export const STATION = { x: stationX, z: stationZ, rotY: Math.atan2(-stationX, -stationZ) }
/** Cửa ga (CableStation đặt điểm tương tác 4.2 m trước nhà ga) */
export const STATION_DOOR = [STATION.x + Math.sin(STATION.rotY) * 4.2, STATION.z + Math.cos(STATION.rotY) * 4.2]
const arriveWorld = CABLE_STATIONS[ZONE_ID].arrive
export const STATION_ARRIVE = [arriveWorld[0] - O[0], arriveWorld[2] - O[2]]

/** NPC hướng dẫn viên đứng gần ga, nhìn về phía khách vừa lên tới */
export const NPC = { x: 16.8, z: 8.2, rotY: Math.atan2(3.2, 4.8) }

/** Mọi điểm tương tác (cục bộ) — dùng cho test */
export const INTERACTION_POINTS = [
  { id: 'huong:dinh-nui-lu', x: INCENSE.x, z: INCENSE.z, stand: INCENSE_STAND },
  { id: 'lay:dinh-nui-tuong-phat-ba', x: ALTAR_MAT.x, z: ALTAR_MAT.z, stand: [ALTAR_MAT.x, ALTAR_MAT.z] },
  ...SEATS.map((s) => ({ id: `seat:${s.id}`, x: s.x, z: s.z, stand: [s.x, s.z] })),
  { id: 'kinh:dinh-nui-an-thu', x: LECTERN.x, z: LECTERN.z, stand: LECTERN_STAND },
  { id: 'npc:huong-dan-dinh', x: NPC.x, z: NPC.z, stand: [NPC.x + Math.sin(NPC.rotY) * 1.2, NPC.z + Math.cos(NPC.rotY) * 1.2] },
  { id: 'cap-treo:dinh-nui', x: STATION_DOOR[0], z: STATION_DOOR[1], stand: STATION_DOOR },
]

/* ---------------- Trang trí ---------------- */

/** Hai hàng đèn đá dọc trục lư hương → tượng */
export const LANTERNS = [-10, -6, -2, 2].flatMap((z) => [
  [-6, z],
  [6, z],
])

/** Cột phướn hai bên bệ tượng */
export const BANNERS = [
  { x: -11, z: -13, color: '#e0a33a' },
  { x: 11, z: -13, color: '#e0a33a' },
  { x: -13, z: -5, color: '#a8322d' },
  { x: 13, z: -5, color: '#a8322d' },
]

/** Lan can đá quanh mép vực: đa giác 48 cạnh, chừa khoảng trống cho đường dốc lên (≈ 30°–52,5°) */
export const RAIL_R = 33.75
const RAIL_SEGMENTS = 48
const RAIL_GAP = [28, 54]
export const RAILING = []
for (let i = 0; i < RAIL_SEGMENTS; i++) {
  const a0 = (i * 360) / RAIL_SEGMENTS
  const a1 = ((i + 1) * 360) / RAIL_SEGMENTS
  const mid = (a0 + a1) / 2
  if (mid > RAIL_GAP[0] && mid < RAIL_GAP[1]) continue
  const [ax, az] = polar(RAIL_R, a0)
  const [bx, bz] = polar(RAIL_R, a1)
  RAILING.push({
    ax,
    az,
    bx,
    bz,
    x: (ax + bx) / 2,
    z: (az + bz) / 2,
    len: Math.hypot(bx - ax, bz - az),
    rot: Math.atan2(bx - ax, bz - az),
  })
}

/** Độ cao cục bộ của sườn núi ngoài mép quảng trường (đồ đặt ngoài mặt đi được) */
const slopeY = (x, z) => terrainHeight(O[0] + x, O[2] + z) - O[1]

/** Đá granite lớn TRONG quảng trường (sát lan can, có vật cản) */
export const INNER_BOULDERS = [
  [75, 2.2],
  [105, 2.0],
  [200, 2.4],
  [215, 1.8],
  [325, 2.2],
  [340, 1.9],
].map(([deg, s], i) => {
  const [x, z] = polar(29.5, deg)
  return { x, y: -0.15, z, s, rot: i * 1.7 }
})

/** Đá granite tảng lớn rải NGOÀI lan can trên sườn đỉnh (không cần vật cản) */
export const OUTER_BOULDERS = (() => {
  const rand = seeded(986)
  const angles = [0, 16, 64, 82, 98, 124, 140, 162, 178, 196, 214, 232, 250, 268, 284, 300, 316, 334, 350]
  return angles.map((deg) => {
    const [x, z] = polar(35.6 + rand() * 3, deg + (rand() - 0.5) * 6)
    return { x, y: slopeY(x, z) - 0.3, z, s: 2.4 + rand() * 2.2, rot: rand() * Math.PI * 2 }
  })
})()

/** Thông thấp mọc ngoài lan can (hai cây gần thiền đài làm bình phong) */
export const PINES = [
  [150, 36.5, 1.1],
  [192, 36.2, 1.0],
  [118, 37, 0.9],
  [246, 37, 1.15],
  [292, 36.5, 0.95],
  [12, 37.5, 1.05],
  [72, 37, 0.85],
].map(([deg, r, s]) => {
  const [x, z] = polar(r, deg)
  return { x, y: slopeY(x, z) - 0.2, z, s }
})

/* ---------------- Vật cản (cục bộ) ---------------- */

const stepsBackZ = STATUE.z + FRONT_STEPS.from - 0.4
export const COLLIDERS = [
  // Bệ tượng bát giác (đường tròn nằm giữa apothem và bán kính ngoại tiếp)
  { type: 'circle', x: STATUE.x, z: STATUE.z, r: STATUE.tiers[0].r * 0.97 },
  // Bậc cấp + bàn thờ đá liền khối trước bệ
  { type: 'box', x: 0, z: (stepsBackZ + altarFrontZ) / 2, w: FRONT_STEPS.width + 0.2, d: altarFrontZ - stepsBackZ, rot: 0 },
  // Lư hương lớn
  { type: 'circle', x: INCENSE.x, z: INCENSE.z, r: 0.72 * INCENSE.scale },
  ...LANTERNS.map(([x, z]) => ({ type: 'circle', x, z, r: 0.3 })),
  ...BANNERS.map(({ x, z }) => ({ type: 'circle', x, z, r: 0.25 })),
  ...DECK_POSTS.map(([x, z]) => ({ type: 'circle', x, z, r: 0.25 })),
  // Án thư
  { type: 'box', x: LECTERN.x, z: LECTERN.z, w: 1.0, d: 0.6, rot: LECTERN.rotY },
  // Nhà ga cáp treo (khung 7.4 × 6.4, thu nhỏ một chút để cửa ga thông thoáng)
  { type: 'box', x: STATION.x, z: STATION.z, w: 7.0, d: 6.0, rot: STATION.rotY },
  ...INNER_BOULDERS.map(({ x, z, s }) => ({ type: 'circle', x, z, r: 0.55 * s })),
  ...RAILING.map(({ x, z, len, rot }) => ({ type: 'box', x, z, w: 0.3, d: len + 0.05, rot })),
]

export const w = (p) => toWorld(O, p)
