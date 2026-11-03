import { decorColliders } from '../../props/decorKinds'
import { ALTAR_TABLE, ALTAR_TABLE_Z, BANNERS, DECK, RAIL_R, STATUE } from './data'

/**
 * Đồ trang trí khu Đỉnh núi (props/decor.jsx) — toạ độ CỤC BỘ, quảng trường tròn r 34.
 * `lean: true` = món cố ý tựa vào vật cản sẵn có (lan can, bệ tượng, bàn thờ).
 * Quy tắc riêng của đỉnh (dinh-nui.test.js): giữa hai vật cản rời nhau phải chừa ≥ 2 m → đồ trên quảng trường
 * hoặc đứng tự do cách xa mọi thứ, hoặc tựa hẳn vào lan can / bệ tượng / bàn thờ (vật cản chồng lên nhau = một khối).
 *  - Đồ tựa lan can đặt đúng GÓC đa giác lan can (bội số 7,5°) để chạm cả hai đoạn kề nhau.
 *  - Sau tượng: bốn bảo tháp nhỏ tựa lan can. Quanh bệ tượng: chậu sen, bonsai. Hai bên bàn thờ: thùng công đức.
 *  - Phướn ngũ sắc giăng giữa các cột phướn sẵn có; chuông gió & đèn lồng dây dưới mái thiền đài.
 */

const rad = (deg) => (deg * Math.PI) / 180
/** Điểm trên tia góc `deg` (0° = +X, 90° = +Z), cách tâm r */
const polar = (r, deg) => ({ x: r * Math.cos(rad(deg)), z: r * Math.sin(rad(deg)) })
/** Mặt món quay vào tâm quảng trường */
const faceIn = (deg) => Math.atan2(-Math.cos(rad(deg)), -Math.sin(rad(deg)))
/** Quanh bệ tượng: góc θ đo từ hướng mặt tượng (+Z), cách tâm tượng r */
const aroundStatue = (r, deg) => ({ x: STATUE.x + r * Math.sin(rad(deg)), z: STATUE.z + r * Math.cos(rad(deg)) })

const STUPA_S = 0.86
/** Đồ tựa lan can: tâm cách lan can (RAIL_R) đúng bằng bán kính chiếm chỗ − 0,1 m */
const byRail = (deg, reach) => polar(RAIL_R - reach + 0.1 - 0.15, deg)

const BANNER_TOP = 6.6
const [bL1, bR1, bL2, bR2] = BANNERS // (−11,−13), (11,−13), (−13,−5), (13,−5)
const EAVE = { x0: DECK.x - DECK.w / 2 - 0.4, x1: DECK.x + DECK.w / 2 + 0.4, z0: DECK.z - DECK.d / 2 - 0.4, z1: DECK.z + DECK.d / 2 + 0.4 }
const EAVE_Y = 3.0

export const DECOR = [
  // Bảo tháp nhỏ sau tượng, tựa lan can
  ...[247.5, 255, 285, 292.5].map((deg, i) => ({
    kind: 'stupa',
    ...byRail(deg, 1.05 * STUPA_S),
    rot: faceIn(deg),
    lean: true,
    s: STUPA_S,
    tiers: i % 3 === 0 ? 4 : 5,
    color: i % 2 ? '#d9d2c2' : undefined,
  })),
  // Quanh bệ tượng (chạm bệ): chậu sen phía trước chéo, bonsai hai bên
  { kind: 'lotusBasin', ...aroundStatue(9.215 + 0.8, 50), lean: true },
  { kind: 'lotusBasin', ...aroundStatue(9.215 + 0.8, -50), lean: true },
  { kind: 'bonsai', ...aroundStatue(9.215 + 0.42, 75), rot: rad(75), stand: 'stone', v: 0, lean: true },
  { kind: 'bonsai', ...aroundStatue(9.215 + 0.42, -75), rot: rad(-75), stand: 'stone', v: 1, lean: true },
  // Thùng công đức tựa hai đầu bàn thờ đá
  { kind: 'donationBox', x: ALTAR_TABLE.w / 2 + 1.25, z: ALTAR_TABLE_Z + 0.3, lean: true },
  { kind: 'donationBox', x: -(ALTAR_TABLE.w / 2 + 1.25), z: ALTAR_TABLE_Z + 0.3, lean: true },
  // Chậu sen đứng tự do hai bên điểm thắp hương; bàn ghế đá hai bên sân trước
  { kind: 'lotusBasin', x: 3, z: 5.8, v: 1 },
  { kind: 'lotusBasin', x: -3, z: 5.8, v: 1 },
  { kind: 'stoneTable', x: 8, z: 18 },
  { kind: 'stoneTable', x: -8, z: 18 },
  // Chậu cây tựa lan can quanh mép (góc đa giác)
  ...[
    [60, 'pottedPlant', 0],
    [90, 'potCluster', 0],
    [120, 'pottedPlant', 2],
    [135, 'pottedPlant', 3],
    [150, 'potCluster', 0],
    [232.5, 'pottedPlant', 1],
    [300, 'pottedPlant', 3],
    [352.5, 'pottedPlant', 0],
  ].map(([deg, kind, v]) => ({ kind, ...byRail(deg, kind === 'potCluster' ? 0.55 : 0.42), rot: faceIn(deg), v, lean: true })),
  // Dây phướn ngũ sắc giữa các cột phướn sẵn có (không thêm cột)
  { kind: 'flagLine', x: bL1.x, z: bL1.z, x2: bL2.x, z2: bL2.z, h: BANNER_TOP, poles: [false, false] },
  { kind: 'flagLine', x: bR1.x, z: bR1.z, x2: bR2.x, z2: bR2.z, h: BANNER_TOP, poles: [false, false] },
  { kind: 'flagLine', x: bL2.x, z: bL2.z, x2: bR2.x, z2: bR2.z, h: BANNER_TOP, poles: [false, false], sag: 1.1 },
  // Thiền đài: chuông gió bốn góc mái, đèn lồng dây dọc mái tây (nhìn ra vực) và mái bắc
  { kind: 'windChime', x: EAVE.x0, y: EAVE_Y, z: EAVE.z0 },
  { kind: 'windChime', x: EAVE.x0, y: EAVE_Y, z: EAVE.z1, v: 1 },
  { kind: 'windChime', x: EAVE.x1, y: EAVE_Y, z: EAVE.z0, v: 1 },
  { kind: 'windChime', x: EAVE.x1, y: EAVE_Y, z: EAVE.z1 },
  { kind: 'stringLights', x: EAVE.x0, z: EAVE.z0 + 0.6, x2: EAVE.x0, z2: EAVE.z1 - 0.6, h: EAVE_Y - 0.05, poles: [false, false], sag: 0.25, every: 1.1 },
  { kind: 'stringLights', x: EAVE.x0 + 0.6, z: EAVE.z1, x2: EAVE.x1 - 0.6, z2: EAVE.z1, h: EAVE_Y - 0.05, poles: [false, false], sag: 0.25, every: 1.1 },
]

export const DECOR_COLLIDERS = decorColliders(DECOR)
